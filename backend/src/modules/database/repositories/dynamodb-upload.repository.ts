import { Upload, UploadRepository } from '../../uploads/interfaces/upload.interface';
import { DynamoDBService } from '../services/dynamodb.service';
import { PutCommand, GetCommand, DeleteCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

export class DynamoDBUploadRepository implements UploadRepository {
  private static instance: DynamoDBUploadRepository;
  private tableName = DynamoDBService.getTableName();

  private constructor() {}

  public static getInstance(): DynamoDBUploadRepository {
    if (!DynamoDBUploadRepository.instance) {
      DynamoDBUploadRepository.instance = new DynamoDBUploadRepository();
    }
    return DynamoDBUploadRepository.instance;
  }

  private mapItemToUpload(item: any): Upload {
    return {
      id: item.id,
      userId: item.userId,
      fileId: item.fileId,
      uploadStatus: item.uploadStatus,
      fileName: item.fileName,
      fileSize: item.fileSize,
      mimeType: item.mimeType,
      uploadProgress: item.uploadProgress,
      uploadMethod: item.uploadMethod,
      startedAt: new Date(item.startedAt),
      completedAt: item.completedAt ? new Date(item.completedAt) : undefined,
      failedAt: item.failedAt ? new Date(item.failedAt) : undefined,
      errorMessage: item.errorMessage,
      createdAt: new Date(item.createdAt),
    };
  }

  private marshalUpload(upload: Partial<Upload>): Record<string, any> {
    const marshalled: Record<string, any> = { ...upload };
    if (upload.startedAt instanceof Date) marshalled.startedAt = upload.startedAt.toISOString();
    if (upload.completedAt instanceof Date) marshalled.completedAt = upload.completedAt.toISOString();
    if (upload.failedAt instanceof Date) marshalled.failedAt = upload.failedAt.toISOString();
    if (upload.createdAt instanceof Date) marshalled.createdAt = upload.createdAt.toISOString();
    return marshalled;
  }

  public async create(uploadData: Omit<Upload, 'id' | 'createdAt'>): Promise<Upload> {
    const id = uuidv4();
    const now = new Date();
    const newUpload: Upload = {
      ...uploadData,
      id,
      createdAt: now,
    };

    const docClient = DynamoDBService.getDocClient();
    const marshalled = this.marshalUpload(newUpload);

    const command = new PutCommand({
      TableName: this.tableName,
      Item: {
        PK: `USER#${newUpload.userId}`,
        SK: `UPLOAD#${id}`,
        GSI3PK: `UPLOAD#${id}`,
        GSI3SK: `USER#${newUpload.userId}`,
        ...marshalled,
      },
    });

    await docClient.send(command);
    return newUpload;
  }

  public async findById(id: string): Promise<Upload | null> {
    const docClient = DynamoDBService.getDocClient();

    // Query fileId/userId in GSI3
    const queryGsi = new QueryCommand({
      TableName: this.tableName,
      IndexName: 'GSI3',
      KeyConditionExpression: 'GSI3PK = :gsi3pk',
      ExpressionAttributeValues: {
        ':gsi3pk': `UPLOAD#${id}`,
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
    return this.mapItemToUpload(response.Item);
  }

  public async update(id: string, updates: Partial<Upload>): Promise<Upload> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error(`Upload transaction with ID ${id} not found`);
    }

    const updatedUpload: Upload = {
      ...existing,
      ...updates,
      createdAt: updates.createdAt || existing.createdAt,
    };

    const docClient = DynamoDBService.getDocClient();
    const marshalled = this.marshalUpload(updatedUpload);

    const command = new PutCommand({
      TableName: this.tableName,
      Item: {
        PK: `USER#${updatedUpload.userId}`,
        SK: `UPLOAD#${id}`,
        GSI3PK: `UPLOAD#${id}`,
        GSI3SK: `USER#${updatedUpload.userId}`,
        ...marshalled,
      },
    });

    await docClient.send(command);
    return updatedUpload;
  }

  public async delete(id: string): Promise<boolean> {
    const upload = await this.findById(id);
    if (!upload) return false;

    const docClient = DynamoDBService.getDocClient();
    const command = new DeleteCommand({
      TableName: this.tableName,
      Key: {
        PK: `USER#${upload.userId}`,
        SK: `UPLOAD#${id}`,
      },
    });

    await docClient.send(command);
    return true;
  }

  public async findAll(userId: string): Promise<Upload[]> {
    const docClient = DynamoDBService.getDocClient();

    const command = new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':sk': 'UPLOAD#',
      },
    });

    const response = await docClient.send(command);
    if (!response.Items) return [];
    return response.Items.map((item) => this.mapItemToUpload(item));
  }

  public async findHistory(userId: string, limit = 10): Promise<Upload[]> {
    const docClient = DynamoDBService.getDocClient();

    // Query uploads for a user and limit
    const command = new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':sk': 'UPLOAD#',
      },
    });

    const response = await docClient.send(command);
    if (!response.Items) return [];
    
    return response.Items
      .map((item) => this.mapItemToUpload(item))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  public async getAnalytics(userId: string): Promise<{
    totalUploads: number;
    successRate: number;
    failureRate: number;
    averageUploadSize: number;
    largestUpload: number;
    recentUploadCount: number;
  }> {
    const userUploads = await this.findAll(userId);
    const totalUploads = userUploads.length;

    if (totalUploads === 0) {
      return {
        totalUploads: 0,
        successRate: 0,
        failureRate: 0,
        averageUploadSize: 0,
        largestUpload: 0,
        recentUploadCount: 0,
      };
    }

    const completed = userUploads.filter((u) => u.uploadStatus === 'COMPLETED').length;
    const failed = userUploads.filter((u) => u.uploadStatus === 'FAILED').length;

    const successRate = Number(((completed / totalUploads) * 100).toFixed(2));
    const failureRate = Number(((failed / totalUploads) * 100).toFixed(2));

    const totalSize = userUploads.reduce((acc, u) => acc + u.fileSize, 0);
    const averageUploadSize = Math.round(totalSize / totalUploads);

    const largestUpload = userUploads.reduce((max, u) => (u.fileSize > max ? u.fileSize : max), 0);

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentUploadCount = userUploads.filter((u) => u.createdAt >= sevenDaysAgo).length;

    return {
      totalUploads,
      successRate,
      failureRate,
      averageUploadSize,
      largestUpload,
      recentUploadCount,
    };
  }
}
