import { Share, ShareRepository } from '../../shares/interfaces/share.interface';
import { DynamoDBService } from '../services/dynamodb.service';
import { RepositoryRegistry } from './registry';
import { PutCommand, GetCommand, DeleteCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

export class DynamoDBShareRepository implements ShareRepository {
  private static instance: DynamoDBShareRepository;
  private tableName = DynamoDBService.getTableName();

  private constructor() {}

  public static getInstance(): DynamoDBShareRepository {
    if (!DynamoDBShareRepository.instance) {
      DynamoDBShareRepository.instance = new DynamoDBShareRepository();
    }
    return DynamoDBShareRepository.instance;
  }

  private mapItemToShare(item: any): Share {
    return {
      id: item.id,
      fileId: item.fileId,
      ownerId: item.ownerId,
      shareLink: item.shareLink,
      shareToken: item.shareToken,
      accessLevel: item.accessLevel,
      shareStatus: item.shareStatus,
      downloadCount: item.downloadCount || 0,
      maxDownloads: item.maxDownloads,
      expiryDate: item.expiryDate ? new Date(item.expiryDate) : undefined,
      passwordProtected: item.passwordProtected,
      passwordHash: item.passwordHash,
      sharedWith: item.sharedWith,
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt),
    };
  }

  private marshalShare(share: Partial<Share>): Record<string, any> {
    const marshalled: Record<string, any> = { ...share };
    if (share.createdAt instanceof Date) marshalled.createdAt = share.createdAt.toISOString();
    if (share.updatedAt instanceof Date) marshalled.updatedAt = share.updatedAt.toISOString();
    if (share.expiryDate instanceof Date) marshalled.expiryDate = share.expiryDate.toISOString();
    return marshalled;
  }

  public async create(
    shareData: Omit<Share, 'id' | 'createdAt' | 'updatedAt' | 'downloadCount'>
  ): Promise<Share> {
    const id = uuidv4();
    const now = new Date();
    const newShare: Share = {
      ...shareData,
      id,
      downloadCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    const docClient = DynamoDBService.getDocClient();
    const marshalled = this.marshalShare(newShare);

    const command = new PutCommand({
      TableName: this.tableName,
      Item: {
        PK: `FILE#${newShare.fileId}`,
        SK: `SHARE#${id}`,
        GSI1PK: `SHARE_TOKEN#${newShare.shareToken}`,
        GSI1SK: `SHARE#${id}`,
        GSI2PK: `OWNER#${newShare.ownerId}`,
        GSI2SK: `SHARE#${id}`,
        GSI3PK: `SHARE#${id}`,
        GSI3SK: `FILE#${newShare.fileId}`,
        ...marshalled,
      },
    });

    await docClient.send(command);
    return newShare;
  }

  public async findById(id: string): Promise<Share | null> {
    const docClient = DynamoDBService.getDocClient();

    // Look up fileId using GSI3
    const queryGsi = new QueryCommand({
      TableName: this.tableName,
      IndexName: 'GSI3',
      KeyConditionExpression: 'GSI3PK = :gsi3pk',
      ExpressionAttributeValues: {
        ':gsi3pk': `SHARE#${id}`,
      },
    });

    const gsiResponse = await docClient.send(queryGsi);
    if (!gsiResponse.Items || gsiResponse.Items.length === 0) return null;

    const pointer = gsiResponse.Items[0];

    // Fetch primary item
    const command = new GetCommand({
      TableName: this.tableName,
      Key: {
        PK: pointer.PK,
        SK: pointer.SK,
      },
    });

    const response = await docClient.send(command);
    if (!response.Item) return null;
    return this.mapItemToShare(response.Item);
  }

  public async findByToken(token: string): Promise<Share | null> {
    const docClient = DynamoDBService.getDocClient();

    // Query index GSI1
    const command = new QueryCommand({
      TableName: this.tableName,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :gsi1pk',
      ExpressionAttributeValues: {
        ':gsi1pk': `SHARE_TOKEN#${token}`,
      },
    });

    const response = await docClient.send(command);
    if (!response.Items || response.Items.length === 0) return null;
    return this.mapItemToShare(response.Items[0]);
  }

  public async update(id: string, updates: Partial<Share>): Promise<Share> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error(`Share transaction with ID ${id} not found`);
    }

    const updatedShare: Share = {
      ...existing,
      ...updates,
      createdAt: updates.createdAt || existing.createdAt,
      updatedAt: new Date(),
    };

    const docClient = DynamoDBService.getDocClient();
    const marshalled = this.marshalShare(updatedShare);

    const command = new PutCommand({
      TableName: this.tableName,
      Item: {
        PK: `FILE#${updatedShare.fileId}`,
        SK: `SHARE#${id}`,
        GSI1PK: `SHARE_TOKEN#${updatedShare.shareToken}`,
        GSI1SK: `SHARE#${id}`,
        GSI2PK: `OWNER#${updatedShare.ownerId}`,
        GSI2SK: `SHARE#${id}`,
        GSI3PK: `SHARE#${id}`,
        GSI3SK: `FILE#${updatedShare.fileId}`,
        ...marshalled,
      },
    });

    await docClient.send(command);
    return updatedShare;
  }

  public async delete(id: string): Promise<boolean> {
    const share = await this.findById(id);
    if (!share) return false;

    const docClient = DynamoDBService.getDocClient();
    const command = new DeleteCommand({
      TableName: this.tableName,
      Key: {
        PK: `FILE#${share.fileId}`,
        SK: `SHARE#${id}`,
      },
    });

    await docClient.send(command);
    return true;
  }

  public async findAll(ownerId: string): Promise<Share[]> {
    const docClient = DynamoDBService.getDocClient();

    const command = new QueryCommand({
      TableName: this.tableName,
      IndexName: 'GSI2',
      KeyConditionExpression: 'GSI2PK = :gsi2pk AND begins_with(GSI2SK, :gsi2sk)',
      ExpressionAttributeValues: {
        ':gsi2pk': `OWNER#${ownerId}`,
        ':gsi2sk': 'SHARE#',
      },
    });

    const response = await docClient.send(command);
    if (!response.Items) return [];
    return response.Items.map((item) => this.mapItemToShare(item));
  }

  public async findActiveByFileId(fileId: string): Promise<Share[]> {
    const docClient = DynamoDBService.getDocClient();

    const command = new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `FILE#${fileId}`,
        ':sk': 'SHARE#',
      },
    });

    const response = await docClient.send(command);
    if (!response.Items) return [];
    return response.Items
      .map((item) => this.mapItemToShare(item))
      .filter((s) => s.shareStatus === 'ACTIVE');
  }

  public async getAnalytics(ownerId: string): Promise<{
    totalShares: number;
    activeShares: number;
    expiredShares: number;
    revokedShares: number;
    mostDownloadedFiles: Array<{ fileId: string; fileName: string; downloadCount: number }>;
    mostSharedFiles: Array<{ fileId: string; fileName: string; shareCount: number }>;
  }> {
    const userShares = await this.findAll(ownerId);
    
    const totalShares = userShares.length;
    const activeShares = userShares.filter((s) => s.shareStatus === 'ACTIVE').length;
    const expiredShares = userShares.filter((s) => s.shareStatus === 'EXPIRED').length;
    const revokedShares = userShares.filter((s) => s.shareStatus === 'REVOKED').length;

    const downloadMap = new Map<string, number>();
    userShares.forEach((s) => {
      const current = downloadMap.get(s.fileId) || 0;
      downloadMap.set(s.fileId, current + s.downloadCount);
    });

    const mostDownloadedRaw = Array.from(downloadMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const fileRepository = RepositoryRegistry.getFileRepository();
    const mostDownloadedFiles = await Promise.all(
      mostDownloadedRaw.map(async ([fileId, count]) => {
        const file = await fileRepository.findById(fileId);
        return {
          fileId,
          fileName: file ? file.fileName : 'Unknown File',
          downloadCount: count,
        };
      })
    );

    const shareCountMap = new Map<string, number>();
    userShares.forEach((s) => {
      const current = shareCountMap.get(s.fileId) || 0;
      shareCountMap.set(s.fileId, current + 1);
    });

    const mostSharedRaw = Array.from(shareCountMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const mostSharedFiles = await Promise.all(
      mostSharedRaw.map(async ([fileId, count]) => {
        const file = await fileRepository.findById(fileId);
        return {
          fileId,
          fileName: file ? file.fileName : 'Unknown File',
          shareCount: count,
        };
      })
    );

    return {
      totalShares,
      activeShares,
      expiredShares,
      revokedShares,
      mostDownloadedFiles,
      mostSharedFiles,
    };
  }
}
