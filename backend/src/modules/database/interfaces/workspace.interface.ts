export interface Workspace {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  ownerId: string;
  planType?: 'FREE' | 'ENTERPRISE';
  memberCount?: number;
  storageUsed?: number;
  storageLimit?: number;
  workspaceStatus?: 'ACTIVE' | 'SUSPENDED';
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

export type WorkspaceRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'EDITOR' | 'MEMBER' | 'VIEWER';

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  status: 'ACTIVE' | 'SUSPENDED';
  permissions: string[];
  joinedAt: Date;
  lastActiveAt: Date;
}

export interface WorkspaceInvitation {
  id: string;
  workspaceId: string;
  email: string;
  role: WorkspaceRole;
  inviteToken: string;
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED';
  expiresAt: Date;
  createdAt: Date;
}

export interface WorkspaceRepository {
  create(workspace: Omit<Workspace, 'id' | 'createdAt' | 'updatedAt'>): Promise<Workspace>;
  findById(id: string): Promise<Workspace | null>;
  findBySlug(slug: string): Promise<Workspace | null>;
  update(id: string, updates: Partial<Workspace>): Promise<Workspace>;
  delete(id: string): Promise<boolean>;
  findByOwnerId(ownerId: string): Promise<Workspace[]>;

  // Membership repository methods
  createMember(member: WorkspaceMember): Promise<WorkspaceMember>;
  findMember(workspaceId: string, userId: string): Promise<WorkspaceMember | null>;
  updateMember(workspaceId: string, userId: string, updates: Partial<WorkspaceMember>): Promise<WorkspaceMember>;
  deleteMember(workspaceId: string, userId: string): Promise<boolean>;
  listMembers(workspaceId: string): Promise<WorkspaceMember[]>;
  listWorkspacesByUserId(userId: string): Promise<Workspace[]>;

  // Invitation repository methods
  createInvite(invite: WorkspaceInvitation): Promise<WorkspaceInvitation>;
  findInviteByToken(token: string): Promise<WorkspaceInvitation | null>;
  findInviteByEmail(workspaceId: string, email: string): Promise<WorkspaceInvitation | null>;
  updateInvite(workspaceId: string, email: string, updates: Partial<WorkspaceInvitation>): Promise<WorkspaceInvitation>;
}
