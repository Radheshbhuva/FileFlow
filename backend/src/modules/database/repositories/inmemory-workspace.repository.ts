import { Workspace, WorkspaceMember, WorkspaceInvitation, WorkspaceRepository } from '../interfaces/workspace.interface';
import { v4 as uuidv4 } from 'uuid';

export class InMemoryWorkspaceRepository implements WorkspaceRepository {
  private workspaces: Workspace[] = [];
  private members: WorkspaceMember[] = [];
  private invites: WorkspaceInvitation[] = [];
  private static instance: InMemoryWorkspaceRepository;

  private constructor() {}

  public static getInstance(): InMemoryWorkspaceRepository {
    if (!InMemoryWorkspaceRepository.instance) {
      InMemoryWorkspaceRepository.instance = new InMemoryWorkspaceRepository();
    }
    return InMemoryWorkspaceRepository.instance;
  }

  public clear(): void {
    this.workspaces = [];
    this.members = [];
    this.invites = [];
  }

  public async create(workspaceData: Omit<Workspace, 'id' | 'createdAt' | 'updatedAt'>): Promise<Workspace> {
    const now = new Date();
    const id = uuidv4();
    const newWorkspace: Workspace = {
      ...workspaceData,
      id,
      slug: workspaceData.slug || `workspace-${id.substring(0, 8)}`,
      planType: workspaceData.planType || 'FREE',
      memberCount: workspaceData.memberCount || 1,
      storageUsed: workspaceData.storageUsed || 0,
      storageLimit: workspaceData.storageLimit || 5 * 1024 * 1024 * 1024,
      workspaceStatus: workspaceData.workspaceStatus || 'ACTIVE',
      createdAt: now,
      updatedAt: now,
    };
    this.workspaces.push(newWorkspace);
    return { ...newWorkspace };
  }

  public async findById(id: string): Promise<Workspace | null> {
    const ws = this.workspaces.find((w) => w.id === id);
    return ws ? { ...ws } : null;
  }

  public async findBySlug(slug: string): Promise<Workspace | null> {
    const ws = this.workspaces.find((w) => w.slug && w.slug.toLowerCase() === slug.toLowerCase());
    return ws ? { ...ws } : null;
  }

  public async update(id: string, updates: Partial<Workspace>): Promise<Workspace> {
    const index = this.workspaces.findIndex((w) => w.id === id);
    if (index === -1) {
      throw new Error(`Workspace with ID ${id} not found`);
    }
    const updated: Workspace = {
      ...this.workspaces[index],
      ...updates,
      updatedAt: new Date(),
    };
    this.workspaces[index] = updated;
    return { ...updated };
  }

  public async delete(id: string): Promise<boolean> {
    const index = this.workspaces.findIndex((w) => w.id === id);
    if (index === -1) return false;
    this.workspaces.splice(index, 1);
    
    // Cleanup cascade members and invites
    this.members = this.members.filter((m) => m.workspaceId !== id);
    this.invites = this.invites.filter((i) => i.workspaceId !== id);
    return true;
  }

  public async findByOwnerId(ownerId: string): Promise<Workspace[]> {
    return this.workspaces.filter((w) => w.ownerId === ownerId).map((w) => ({ ...w }));
  }

  // =========================================================================
  // Membership Methods
  // =========================================================================

  public async createMember(member: WorkspaceMember): Promise<WorkspaceMember> {
    const newMember = { ...member };
    this.members.push(newMember);
    return newMember;
  }

  public async findMember(workspaceId: string, userId: string): Promise<WorkspaceMember | null> {
    const member = this.members.find((m) => m.workspaceId === workspaceId && m.userId === userId);
    return member ? { ...member } : null;
  }

  public async updateMember(
    workspaceId: string,
    userId: string,
    updates: Partial<WorkspaceMember>
  ): Promise<WorkspaceMember> {
    const index = this.members.findIndex((m) => m.workspaceId === workspaceId && m.userId === userId);
    if (index === -1) {
      throw new Error(`Member not found`);
    }
    const updated = { ...this.members[index], ...updates, lastActiveAt: new Date() };
    this.members[index] = updated;
    return { ...updated };
  }

  public async deleteMember(workspaceId: string, userId: string): Promise<boolean> {
    const index = this.members.findIndex((m) => m.workspaceId === workspaceId && m.userId === userId);
    if (index === -1) return false;
    this.members.splice(index, 1);
    return true;
  }

  public async listMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    return this.members.filter((m) => m.workspaceId === workspaceId).map((m) => ({ ...m }));
  }

  public async listWorkspacesByUserId(userId: string): Promise<Workspace[]> {
    const workspaceIds = this.members.filter((m) => m.userId === userId).map((m) => m.workspaceId);
    return this.workspaces.filter((w) => workspaceIds.includes(w.id)).map((w) => ({ ...w }));
  }

  // =========================================================================
  // Invitation Methods
  // =========================================================================

  public async createInvite(invite: WorkspaceInvitation): Promise<WorkspaceInvitation> {
    const newInvite = { ...invite };
    this.invites.push(newInvite);
    return newInvite;
  }

  public async findInviteByToken(token: string): Promise<WorkspaceInvitation | null> {
    const invite = this.invites.find((i) => i.inviteToken === token);
    return invite ? { ...invite } : null;
  }

  public async findInviteByEmail(workspaceId: string, email: string): Promise<WorkspaceInvitation | null> {
    const invite = this.invites.find((i) => i.workspaceId === workspaceId && i.email.toLowerCase() === email.toLowerCase());
    return invite ? { ...invite } : null;
  }

  public async updateInvite(
    workspaceId: string,
    email: string,
    updates: Partial<WorkspaceInvitation>
  ): Promise<WorkspaceInvitation> {
    const index = this.invites.findIndex(
      (i) => i.workspaceId === workspaceId && i.email.toLowerCase() === email.toLowerCase()
    );
    if (index === -1) {
      throw new Error(`Invitation not found`);
    }
    const updated = { ...this.invites[index], ...updates };
    this.invites[index] = updated;
    return { ...updated };
  }
}
