import { Workspace, WorkspaceMember, WorkspaceInvitation, WorkspaceRepository } from '../interfaces/workspace.interface';
import { DynamoDBService } from '../services/dynamodb.service';
import { PutCommand, GetCommand, DeleteCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

export class DynamoDBWorkspaceRepository implements WorkspaceRepository {
  private static instance: DynamoDBWorkspaceRepository;
  private tableName = DynamoDBService.getTableName();

  private constructor() {}

  public static getInstance(): DynamoDBWorkspaceRepository {
    if (!DynamoDBWorkspaceRepository.instance) {
      DynamoDBWorkspaceRepository.instance = new DynamoDBWorkspaceRepository();
    }
    return DynamoDBWorkspaceRepository.instance;
  }

  private mapItemToWorkspace(item: any): Workspace {
    return {
      id: item.id,
      name: item.name,
      slug: item.slug,
      description: item.description,
      ownerId: item.ownerId,
      planType: item.planType || 'FREE',
      memberCount: item.memberCount || 1,
      storageUsed: item.storageUsed || 0,
      storageLimit: item.storageLimit || 5 * 1024 * 1024 * 1024,
      workspaceStatus: item.workspaceStatus || 'ACTIVE',
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt),
      metadata: item.metadata,
    };
  }

  private marshalWorkspace(ws: Partial<Workspace>): Record<string, any> {
    const marshalled: Record<string, any> = { ...ws };
    if (ws.createdAt instanceof Date) marshalled.createdAt = ws.createdAt.toISOString();
    if (ws.updatedAt instanceof Date) marshalled.updatedAt = ws.updatedAt.toISOString();
    return marshalled;
  }

  private mapItemToMember(item: any): WorkspaceMember {
    return {
      id: item.id,
      workspaceId: item.workspaceId,
      userId: item.userId,
      role: item.role,
      status: item.status || 'ACTIVE',
      permissions: item.permissions || [],
      joinedAt: new Date(item.joinedAt),
      lastActiveAt: new Date(item.lastActiveAt),
    };
  }

  private marshalMember(member: Partial<WorkspaceMember>): Record<string, any> {
    const marshalled: Record<string, any> = { ...member };
    if (member.joinedAt instanceof Date) marshalled.joinedAt = member.joinedAt.toISOString();
    if (member.lastActiveAt instanceof Date) marshalled.lastActiveAt = member.lastActiveAt.toISOString();
    return marshalled;
  }

  private mapItemToInvite(item: any): WorkspaceInvitation {
    return {
      id: item.id,
      workspaceId: item.workspaceId,
      email: item.email,
      role: item.role,
      inviteToken: item.inviteToken,
      status: item.status || 'PENDING',
      expiresAt: new Date(item.expiresAt),
      createdAt: new Date(item.createdAt),
    };
  }

  private marshalInvite(invite: Partial<WorkspaceInvitation>): Record<string, any> {
    const marshalled: Record<string, any> = { ...invite };
    if (invite.expiresAt instanceof Date) marshalled.expiresAt = invite.expiresAt.toISOString();
    if (invite.createdAt instanceof Date) marshalled.createdAt = invite.createdAt.toISOString();
    return marshalled;
  }

  public async create(
    workspaceData: Omit<Workspace, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Workspace> {
    const id = uuidv4();
    const now = new Date();
    const slug = workspaceData.slug || `workspace-${id.substring(0, 8)}`;
    const newWorkspace: Workspace = {
      name: workspaceData.name,
      slug,
      description: workspaceData.description,
      ownerId: workspaceData.ownerId,
      planType: workspaceData.planType || 'FREE',
      memberCount: workspaceData.memberCount || 1,
      storageUsed: workspaceData.storageUsed || 0,
      storageLimit: workspaceData.storageLimit || 5 * 1024 * 1024 * 1024,
      workspaceStatus: workspaceData.workspaceStatus || 'ACTIVE',
      metadata: workspaceData.metadata,
      id,
      createdAt: now,
      updatedAt: now,
    };

    const docClient = DynamoDBService.getDocClient();
    const marshalled = this.marshalWorkspace(newWorkspace);

    const command = new PutCommand({
      TableName: this.tableName,
      Item: {
        PK: `WORKSPACE#${id}`,
        SK: 'METADATA',
        GSI1PK: `WORKSPACE_SLUG#${slug.toLowerCase()}`,
        GSI1SK: 'METADATA',
        GSI2PK: `OWNER#${newWorkspace.ownerId}`,
        GSI2SK: `WORKSPACE#${id}`,
        ...marshalled,
      },
    });

    await docClient.send(command);
    return newWorkspace;
  }

  public async findById(id: string): Promise<Workspace | null> {
    const docClient = DynamoDBService.getDocClient();
    const command = new GetCommand({
      TableName: this.tableName,
      Key: {
        PK: `WORKSPACE#${id}`,
        SK: 'METADATA',
      },
    });

    const response = await docClient.send(command);
    if (!response.Item) return null;
    return this.mapItemToWorkspace(response.Item);
  }

  public async findBySlug(slug: string): Promise<Workspace | null> {
    const docClient = DynamoDBService.getDocClient();
    const command = new QueryCommand({
      TableName: this.tableName,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :gsi1pk AND GSI1SK = :gsi1sk',
      ExpressionAttributeValues: {
        ':gsi1pk': `WORKSPACE_SLUG#${slug.toLowerCase()}`,
        ':gsi1sk': 'METADATA',
      },
    });

    const response = await docClient.send(command);
    if (!response.Items || response.Items.length === 0) return null;
    return this.mapItemToWorkspace(response.Items[0]);
  }

  public async update(id: string, updates: Partial<Workspace>): Promise<Workspace> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error(`Workspace with ID ${id} not found`);
    }

    const updatedWorkspace: Workspace = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };

    const docClient = DynamoDBService.getDocClient();
    const marshalled = this.marshalWorkspace(updatedWorkspace);

    const slug = updatedWorkspace.slug || `workspace-${id.substring(0, 8)}`;

    const command = new PutCommand({
      TableName: this.tableName,
      Item: {
        PK: `WORKSPACE#${id}`,
        SK: 'METADATA',
        GSI1PK: `WORKSPACE_SLUG#${slug.toLowerCase()}`,
        GSI1SK: 'METADATA',
        GSI2PK: `OWNER#${updatedWorkspace.ownerId}`,
        GSI2SK: `WORKSPACE#${id}`,
        ...marshalled,
      },
    });

    await docClient.send(command);
    return updatedWorkspace;
  }

  public async delete(id: string): Promise<boolean> {
    const existing = await this.findById(id);
    if (!existing) return false;

    const docClient = DynamoDBService.getDocClient();
    const command = new DeleteCommand({
      TableName: this.tableName,
      Key: {
        PK: `WORKSPACE#${id}`,
        SK: 'METADATA',
      },
    });

    await docClient.send(command);
    return true;
  }

  public async findByOwnerId(ownerId: string): Promise<Workspace[]> {
    const docClient = DynamoDBService.getDocClient();
    const command = new QueryCommand({
      TableName: this.tableName,
      IndexName: 'GSI2',
      KeyConditionExpression: 'GSI2PK = :gsi2pk AND begins_with(GSI2SK, :gsi2sk)',
      ExpressionAttributeValues: {
        ':gsi2pk': `OWNER#${ownerId}`,
        ':gsi2sk': 'WORKSPACE#',
      },
    });

    const response = await docClient.send(command);
    if (!response.Items) return [];
    return response.Items.map((item) => this.mapItemToWorkspace(item));
  }

  // =========================================================================
  // Membership Methods
  // =========================================================================

  public async createMember(member: WorkspaceMember): Promise<WorkspaceMember> {
    const docClient = DynamoDBService.getDocClient();
    const marshalled = this.marshalMember(member);
    const command = new PutCommand({
      TableName: this.tableName,
      Item: {
        PK: `WORKSPACE#${member.workspaceId}`,
        SK: `MEMBER#${member.userId}`,
        GSI1PK: `USER#${member.userId}`,
        GSI1SK: `WORKSPACE#${member.workspaceId}`,
        ...marshalled,
      },
    });
    await docClient.send(command);
    return member;
  }

  public async findMember(workspaceId: string, userId: string): Promise<WorkspaceMember | null> {
    const docClient = DynamoDBService.getDocClient();
    const command = new GetCommand({
      TableName: this.tableName,
      Key: {
        PK: `WORKSPACE#${workspaceId}`,
        SK: `MEMBER#${userId}`,
      },
    });
    const response = await docClient.send(command);
    if (!response.Item) return null;
    return this.mapItemToMember(response.Item);
  }

  public async updateMember(
    workspaceId: string,
    userId: string,
    updates: Partial<WorkspaceMember>
  ): Promise<WorkspaceMember> {
    const existing = await this.findMember(workspaceId, userId);
    if (!existing) {
      throw new Error(`Member not found`);
    }
    const updated = { ...existing, ...updates, lastActiveAt: new Date() };
    const docClient = DynamoDBService.getDocClient();
    const marshalled = this.marshalMember(updated);
    const command = new PutCommand({
      TableName: this.tableName,
      Item: {
        PK: `WORKSPACE#${workspaceId}`,
        SK: `MEMBER#${userId}`,
        GSI1PK: `USER#${userId}`,
        GSI1SK: `WORKSPACE#${workspaceId}`,
        ...marshalled,
      },
    });
    await docClient.send(command);
    return updated;
  }

  public async deleteMember(workspaceId: string, userId: string): Promise<boolean> {
    const docClient = DynamoDBService.getDocClient();
    const command = new DeleteCommand({
      TableName: this.tableName,
      Key: {
        PK: `WORKSPACE#${workspaceId}`,
        SK: `MEMBER#${userId}`,
      },
    });
    await docClient.send(command);
    return true;
  }

  public async listMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    const docClient = DynamoDBService.getDocClient();
    const command = new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `WORKSPACE#${workspaceId}`,
        ':sk': 'MEMBER#',
      },
    });
    const response = await docClient.send(command);
    if (!response.Items) return [];
    return response.Items.map((item) => this.mapItemToMember(item));
  }

  public async listWorkspacesByUserId(userId: string): Promise<Workspace[]> {
    const docClient = DynamoDBService.getDocClient();
    const command = new QueryCommand({
      TableName: this.tableName,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :gsi1pk AND begins_with(GSI1SK, :gsi1sk)',
      ExpressionAttributeValues: {
        ':gsi1pk': `USER#${userId}`,
        ':gsi1sk': 'WORKSPACE#',
      },
    });
    const response = await docClient.send(command);
    if (!response.Items) return [];

    const workspaces: Workspace[] = [];
    for (const item of response.Items) {
      const workspaceId = item.workspaceId;
      const ws = await this.findById(workspaceId);
      if (ws) {
        workspaces.push(ws);
      }
    }
    return workspaces;
  }

  // =========================================================================
  // Invitation Methods
  // =========================================================================

  public async createInvite(invite: WorkspaceInvitation): Promise<WorkspaceInvitation> {
    const docClient = DynamoDBService.getDocClient();
    const marshalled = this.marshalInvite(invite);
    const command = new PutCommand({
      TableName: this.tableName,
      Item: {
        PK: `WORKSPACE#${invite.workspaceId}`,
        SK: `INVITE#${invite.email.toLowerCase().trim()}`,
        GSI1PK: `INVITE_TOKEN#${invite.inviteToken}`,
        GSI1SK: `INVITE#${invite.email.toLowerCase().trim()}`,
        ...marshalled,
      },
    });
    await docClient.send(command);
    return invite;
  }

  public async findInviteByToken(token: string): Promise<WorkspaceInvitation | null> {
    const docClient = DynamoDBService.getDocClient();
    const command = new QueryCommand({
      TableName: this.tableName,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :gsi1pk',
      ExpressionAttributeValues: {
        ':gsi1pk': `INVITE_TOKEN#${token}`,
      },
    });
    const response = await docClient.send(command);
    if (!response.Items || response.Items.length === 0) return null;
    return this.mapItemToInvite(response.Items[0]);
  }

  public async findInviteByEmail(workspaceId: string, email: string): Promise<WorkspaceInvitation | null> {
    const docClient = DynamoDBService.getDocClient();
    const command = new GetCommand({
      TableName: this.tableName,
      Key: {
        PK: `WORKSPACE#${workspaceId}`,
        SK: `INVITE#${email.toLowerCase().trim()}`,
      },
    });
    const response = await docClient.send(command);
    if (!response.Item) return null;
    return this.mapItemToInvite(response.Item);
  }

  public async updateInvite(
    workspaceId: string,
    email: string,
    updates: Partial<WorkspaceInvitation>
  ): Promise<WorkspaceInvitation> {
    const existing = await this.findInviteByEmail(workspaceId, email);
    if (!existing) {
      throw new Error(`Invitation not found`);
    }
    const updated = { ...existing, ...updates };
    const docClient = DynamoDBService.getDocClient();
    const marshalled = this.marshalInvite(updated);
    const command = new PutCommand({
      TableName: this.tableName,
      Item: {
        PK: `WORKSPACE#${workspaceId}`,
        SK: `INVITE#${email.toLowerCase().trim()}`,
        GSI1PK: `INVITE_TOKEN#${updated.inviteToken}`,
        GSI1SK: `INVITE#${email.toLowerCase().trim()}`,
        ...marshalled,
      },
    });
    await docClient.send(command);
    return updated;
  }
}
