import { Workspace, WorkspaceMember, WorkspaceInvitation, WorkspaceRole } from '../../database/interfaces/workspace.interface';
import { RepositoryRegistry } from '../../database/repositories/registry';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../../utils/app-error';
import { v4 as uuidv4 } from 'uuid';
import { ROLE_PERMISSIONS } from '../../../middleware/rbac.middleware';
import { ActivityService } from '../../activity/services/activity.service';
import { Activity } from '../../activity/interfaces/activity.interface';

export class WorkspaceService {
  private workspaceRepo = RepositoryRegistry.getWorkspaceRepository();
  private fileRepo = RepositoryRegistry.getFileRepository();
  private activityService = new ActivityService();

  /**
   * Create a new enterprise team workspace
   */
  public async createWorkspace(
    userId: string,
    data: { name: string; slug: string; description?: string }
  ): Promise<Workspace> {
    // 1. Validate slug uniqueness
    const existingSlug = await this.workspaceRepo.findBySlug(data.slug);
    if (existingSlug) {
      throw new BadRequestError(`Slug '${data.slug}' is already taken`);
    }

    // 2. Create workspace metadata
    const workspace = await this.workspaceRepo.create({
      name: data.name,
      slug: data.slug,
      description: data.description,
      ownerId: userId,
      planType: 'FREE',
      memberCount: 1,
      storageUsed: 0,
      storageLimit: 5 * 1024 * 1024 * 1024, // 5 GB default
      workspaceStatus: 'ACTIVE',
    });

    // 3. Automatically add creator as OWNER member
    const ownerMember: WorkspaceMember = {
      id: uuidv4(),
      workspaceId: workspace.id,
      userId,
      role: 'OWNER',
      status: 'ACTIVE',
      permissions: ROLE_PERMISSIONS.OWNER || [],
      joinedAt: new Date(),
      lastActiveAt: new Date(),
    };
    await this.workspaceRepo.createMember(ownerMember);

    // 4. Log Activity
    await this.activityService.createActivity({
      userId,
      activityType: 'WORKSPACE_CREATED',
      resourceType: 'WORKSPACE',
      resourceId: workspace.id,
      resourceName: workspace.name,
      description: `Workspace '${workspace.name}' was created.`,
      severity: 'INFO',
      metadata: { workspaceId: workspace.id },
    });

    return workspace;
  }

  /**
   * Fetch all workspaces a user has membership in
   */
  public async getUserWorkspaces(userId: string): Promise<Workspace[]> {
    return this.workspaceRepo.listWorkspacesByUserId(userId);
  }

  /**
   * Get workspace by ID
   */
  public async getWorkspaceById(workspaceId: string): Promise<Workspace> {
    const ws = await this.workspaceRepo.findById(workspaceId);
    if (!ws) {
      throw new NotFoundError(`Workspace with ID ${workspaceId} not found`);
    }
    return ws;
  }

  /**
   * Update workspace details
   */
  public async updateWorkspace(
    workspaceId: string,
    userId: string,
    updates: Partial<Workspace>
  ): Promise<Workspace> {
    const workspace = await this.getWorkspaceById(workspaceId);

    if (updates.slug && updates.slug !== workspace.slug) {
      const existingSlug = await this.workspaceRepo.findBySlug(updates.slug);
      if (existingSlug) {
        throw new BadRequestError(`Slug '${updates.slug}' is already taken`);
      }
    }

    const updated = await this.workspaceRepo.update(workspaceId, updates);

    // Log Activity
    await this.activityService.createActivity({
      userId,
      activityType: 'WORKSPACE_UPDATED',
      resourceType: 'WORKSPACE',
      resourceId: workspaceId,
      resourceName: updated.name,
      description: `Workspace details updated.`,
      severity: 'INFO',
      metadata: { workspaceId },
    });

    return updated;
  }

  /**
   * Delete workspace (cascade members and invitations)
   */
  public async deleteWorkspace(workspaceId: string, userId: string): Promise<void> {
    await this.getWorkspaceById(workspaceId);

    await this.workspaceRepo.delete(workspaceId);

    // Log Activity
    await this.activityService.createActivity({
      userId,
      activityType: 'FILE_DELETED', // Reusing matching type for general cleanup log
      resourceType: 'WORKSPACE',
      resourceId: workspaceId,
      description: `Workspace was deleted.`,
      severity: 'WARNING',
    });
  }

  // =========================================================================
  // Member Management
  // =========================================================================

  public async getMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    await this.getWorkspaceById(workspaceId);
    return this.workspaceRepo.listMembers(workspaceId);
  }

  public async updateMemberRole(
    workspaceId: string,
    userId: string,
    memberId: string,
    role: WorkspaceRole
  ): Promise<WorkspaceMember> {
    const member = await this.workspaceRepo.findMember(workspaceId, memberId);
    if (!member) {
      throw new NotFoundError(`Member with ID ${memberId} not found in this workspace`);
    }

    if (member.role === 'OWNER') {
      throw new BadRequestError('Cannot change the role of the workspace Owner');
    }

    const updated = await this.workspaceRepo.updateMember(workspaceId, memberId, {
      role,
      permissions: ROLE_PERMISSIONS[role as WorkspaceRole] || [],
    });

    // Log Activity
    await this.activityService.createActivity({
      userId,
      activityType: 'ROLE_CHANGED',
      resourceType: 'MEMBER',
      resourceId: memberId,
      description: `Role changed to ${role} for member ${memberId}.`,
      severity: 'INFO',
      metadata: { workspaceId },
    });

    return updated;
  }

  public async removeMember(workspaceId: string, userId: string, memberId: string): Promise<void> {
    const member = await this.workspaceRepo.findMember(workspaceId, memberId);
    if (!member) {
      throw new NotFoundError(`Member with ID ${memberId} not found in this workspace`);
    }

    if (member.role === 'OWNER') {
      throw new BadRequestError('Cannot remove the workspace Owner');
    }

    await this.workspaceRepo.deleteMember(workspaceId, memberId);

    // Decrement member count
    const workspace = await this.getWorkspaceById(workspaceId);
    await this.workspaceRepo.update(workspaceId, {
      memberCount: Math.max(1, (workspace.memberCount || 1) - 1),
    });

    // Log Activity
    await this.activityService.createActivity({
      userId,
      activityType: 'MEMBER_REMOVED',
      resourceType: 'MEMBER',
      resourceId: memberId,
      description: `Member ${memberId} was removed from workspace.`,
      severity: 'WARNING',
      metadata: { workspaceId },
    });
  }

  // =========================================================================
  // Invitation Flow
  // =========================================================================

  public async inviteMember(
    workspaceId: string,
    senderId: string,
    email: string,
    role: WorkspaceRole
  ): Promise<WorkspaceInvitation> {
    await this.getWorkspaceById(workspaceId);

    // Check if email is already a member of this workspace
    const members = await this.workspaceRepo.listMembers(workspaceId);
    const userRepo = RepositoryRegistry.getUserRepository();
    const targetUser = await userRepo.findByEmail(email);
    if (targetUser) {
      const isMember = members.some((m: WorkspaceMember) => m.userId === targetUser.id);
      if (isMember) {
        throw new BadRequestError(`User with email '${email}' is already a member`);
      }
    }

    // Check for existing pending invitation
    const existingInvite = await this.workspaceRepo.findInviteByEmail(workspaceId, email);
    if (existingInvite && existingInvite.status === 'PENDING' && existingInvite.expiresAt > new Date()) {
      return existingInvite; // Return the active invitation
    }

    const inviteToken = uuidv4().replace(/-/g, '');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    const newInvite = await this.workspaceRepo.createInvite({
      id: uuidv4(),
      workspaceId,
      email: email.toLowerCase().trim(),
      role,
      inviteToken,
      status: 'PENDING',
      expiresAt,
      createdAt: new Date(),
    });

    // Log Activity
    await this.activityService.createActivity({
      userId: senderId,
      activityType: 'SHARE_CREATED', // Sharing access type
      resourceType: 'INVITATION',
      resourceId: newInvite.id,
      description: `Invited email ${email} to join workspace.`,
      severity: 'INFO',
      metadata: { workspaceId },
    });

    return newInvite;
  }

  public async acceptInvitation(userId: string, email: string, token: string): Promise<WorkspaceMember> {
    const invite = await this.workspaceRepo.findInviteByToken(token);
    if (!invite) {
      throw new BadRequestError('Invalid or expired invitation token');
    }

    if (invite.status !== 'PENDING') {
      throw new BadRequestError('This invitation has already been accepted or processed');
    }

    if (invite.expiresAt < new Date()) {
      await this.workspaceRepo.updateInvite(invite.workspaceId, invite.email, { status: 'EXPIRED' });
      throw new BadRequestError('This invitation has expired');
    }

    if (invite.email.toLowerCase() !== email.toLowerCase()) {
      throw new ForbiddenError('This invitation is not assigned to your account email');
    }

    // Create the member item
    const member: WorkspaceMember = {
      id: uuidv4(),
      workspaceId: invite.workspaceId,
      userId,
      role: invite.role,
      status: 'ACTIVE',
      permissions: ROLE_PERMISSIONS[invite.role as WorkspaceRole] || [],
      joinedAt: new Date(),
      lastActiveAt: new Date(),
    };

    await this.workspaceRepo.createMember(member);

    // Update invite status
    await this.workspaceRepo.updateInvite(invite.workspaceId, invite.email, { status: 'ACCEPTED' });

    // Increment member count in workspace
    const workspace = await this.getWorkspaceById(invite.workspaceId);
    await this.workspaceRepo.update(invite.workspaceId, {
      memberCount: (workspace.memberCount || 1) + 1,
    });

    // Log activities
    await this.activityService.createActivity({
      userId,
      activityType: 'INVITATION_ACCEPTED',
      resourceType: 'INVITATION',
      resourceId: invite.id,
      description: `Invitation accepted. Joined workspace '${workspace.name}'.`,
      severity: 'INFO',
      metadata: { workspaceId: invite.workspaceId },
    });

    await this.activityService.createActivity({
      userId,
      activityType: 'MEMBER_JOINED',
      resourceType: 'MEMBER',
      resourceId: member.id,
      description: `New member joined workspace.`,
      severity: 'INFO',
      metadata: { workspaceId: invite.workspaceId },
    });

    return member;
  }

  // =========================================================================
  // Dashboard & Analytics
  // =========================================================================

  public async getWorkspaceDashboard(workspaceId: string): Promise<any> {
    const workspace = await this.getWorkspaceById(workspaceId);

    // Fetch workspace files to calculate storage usage and file count
    const { files } = await this.fileRepo.findAll(
      workspaceId,
      {},
      { page: 1, limit: 10000 },
      { sortBy: 'createdAt', sortOrder: 'desc' }
    );

    const filesUploaded = files.length;
    const totalStorageUsed = files.reduce((sum: number, file: any) => sum + file.fileSize, 0);

    // Refresh workspace storageUsed if it has drifted
    if (workspace.storageUsed !== totalStorageUsed) {
      await this.workspaceRepo.update(workspaceId, { storageUsed: totalStorageUsed });
      workspace.storageUsed = totalStorageUsed;
    }

    // Calculate workspace security/health score (average file security score)
    const activeFiles = files.filter((f: any) => f.status !== 'DELETED');
    const healthScore =
      activeFiles.length > 0
        ? activeFiles.reduce((sum: number, f: any) => sum + (f.securityScore || 0), 0) / activeFiles.length
        : 100;

    // Fetch workspace activities
    const activityRepo = RepositoryRegistry.getActivityRepository();
    const recentActivities = await activityRepo.findRecent(undefined, 5);
    const filteredActivities = recentActivities.filter(
      (act: Activity) => act.metadata?.workspaceId === workspaceId || act.userId === workspace.ownerId
    );

    return {
      totalMembers: workspace.memberCount,
      storageUsage: workspace.storageUsed,
      storageLimit: workspace.storageLimit,
      filesUploaded,
      recentActivity: filteredActivities,
      workspaceHealthScore: Math.round(healthScore),
    };
  }

  public async getWorkspaceAnalytics(workspaceId: string): Promise<any> {
    const workspace = await this.getWorkspaceById(workspaceId);
    
    // Fetch all files
    const { files } = await this.fileRepo.findAll(
      workspaceId,
      {},
      { page: 1, limit: 10000 },
      { sortBy: 'createdAt', sortOrder: 'desc' }
    );

    // Fetch activities and filter for this workspace
    const activityRepo = RepositoryRegistry.getActivityRepository();
    const allActivities = await activityRepo.findRecent(undefined, 1000);
    const workspaceActivities = allActivities.filter(
      (act: Activity) => act.metadata?.workspaceId === workspaceId
    );

    // 1. Group activities by active members
    const memberCounts: Record<string, number> = {};
    workspaceActivities.forEach((act: Activity) => {
      if (act.userId) {
        memberCounts[act.userId] = (memberCounts[act.userId] || 0) + 1;
      }
    });

    const userRepo = RepositoryRegistry.getUserRepository();
    const mostActiveMembers = await Promise.all(
      Object.entries(memberCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(async ([userId, count]) => {
          const user = await userRepo.findById(userId);
          return {
            userId,
            fullName: user?.fullName || 'Unknown User',
            email: user?.email || 'Unknown Email',
            activityCount: count,
          };
        })
    );

    // 2. Count upload vs share events
    const uploadActivity = workspaceActivities.filter((act: Activity) => act.activityType === 'FILE_UPLOADED').length;
    const shareActivity = workspaceActivities.filter(
      (act: Activity) => act.activityType === 'FILE_SHARED' || act.activityType === 'SHARE_CREATED'
    ).length;

    // 3. Storage growth metrics
    const storageUsed = workspace.storageUsed;

    return {
      mostActiveMembers,
      uploadActivity,
      shareActivity,
      workspaceStorageUsage: storageUsed,
      collaborationMetrics: {
        totalInvitationsSent: workspaceActivities.filter((act: Activity) => act.resourceType === 'INVITATION').length,
        activeMembersCount: workspace.memberCount,
      },
    };
  }
}
