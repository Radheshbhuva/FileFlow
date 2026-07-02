import { Notification, NotificationRepository, NotificationSummary, NotificationStatus, NotificationSeverity } from '../../notifications/interfaces/notification.interface';
import { DynamoDBService } from '../services/dynamodb.service';
import { PutCommand, GetCommand, DeleteCommand, QueryCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

export class DynamoDBNotificationRepository implements NotificationRepository {
  private static instance: DynamoDBNotificationRepository;
  private tableName = DynamoDBService.getTableName();

  private constructor() {}

  public static getInstance(): DynamoDBNotificationRepository {
    if (!DynamoDBNotificationRepository.instance) {
      DynamoDBNotificationRepository.instance = new DynamoDBNotificationRepository();
    }
    return DynamoDBNotificationRepository.instance;
  }

  private mapItemToNotification(item: any): Notification {
    return {
      id: item.id,
      userId: item.userId,
      notificationType: item.notificationType,
      title: item.title,
      message: item.message,
      severity: item.severity,
      status: item.status,
      metadata: item.metadata,
      createdAt: new Date(item.createdAt),
      readAt: item.readAt ? new Date(item.readAt) : undefined,
    };
  }

  private marshalNotification(notif: Partial<Notification>): Record<string, any> {
    const marshalled: Record<string, any> = { ...notif };
    if (notif.createdAt instanceof Date) marshalled.createdAt = notif.createdAt.toISOString();
    if (notif.readAt instanceof Date) marshalled.readAt = notif.readAt.toISOString();
    return marshalled;
  }

  public async create(
    data: Omit<Notification, 'id' | 'createdAt' | 'status'> & { status?: NotificationStatus }
  ): Promise<Notification> {
    const id = uuidv4();
    const now = new Date();
    const newNotification: Notification = {
      ...data,
      id,
      status: data.status || 'UNREAD',
      createdAt: now,
    };

    const docClient = DynamoDBService.getDocClient();
    const marshalled = this.marshalNotification(newNotification);

    const command = new PutCommand({
      TableName: this.tableName,
      Item: {
        PK: `USER#${newNotification.userId}`,
        SK: `NOTIFICATION#${now.toISOString()}#${id}`,
        GSI3PK: `NOTIFICATION#${id}`,
        GSI3SK: `USER#${newNotification.userId}`,
        GSI5PK: `USER#${newNotification.userId}`,
        GSI5SK: `${newNotification.status}#${now.toISOString()}`,
        ...marshalled,
      },
    });

    await docClient.send(command);
    return newNotification;
  }

  public async findById(id: string): Promise<Notification | null> {
    const docClient = DynamoDBService.getDocClient();

    // Query fileId/userId in GSI3
    const queryGsi = new QueryCommand({
      TableName: this.tableName,
      IndexName: 'GSI3',
      KeyConditionExpression: 'GSI3PK = :gsi3pk',
      ExpressionAttributeValues: {
        ':gsi3pk': `NOTIFICATION#${id}`,
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
    return this.mapItemToNotification(response.Item);
  }

  public async update(id: string, updates: Partial<Notification>): Promise<Notification> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error(`Notification with ID ${id} not found`);
    }

    const nextStatus = updates.status || existing.status;
    let readAt = updates.readAt || existing.readAt;

    if (updates.status === 'READ' && existing.status === 'UNREAD' && !readAt) {
      readAt = new Date();
    }

    const updatedNotification: Notification = {
      ...existing,
      ...updates,
      status: nextStatus,
      readAt,
    };

    const docClient = DynamoDBService.getDocClient();
    const marshalled = this.marshalNotification(updatedNotification);

    const command = new PutCommand({
      TableName: this.tableName,
      Item: {
        PK: `USER#${updatedNotification.userId}`,
        SK: `NOTIFICATION#${existing.createdAt.toISOString()}#${id}`,
        GSI3PK: `NOTIFICATION#${id}`,
        GSI3SK: `USER#${updatedNotification.userId}`,
        GSI5PK: `USER#${updatedNotification.userId}`,
        GSI5SK: `${nextStatus}#${existing.createdAt.toISOString()}`,
        ...marshalled,
      },
    });

    await docClient.send(command);
    return updatedNotification;
  }

  public async findAll(
    userId: string,
    filters?: { status?: NotificationStatus; severity?: NotificationSeverity }
  ): Promise<Notification[]> {
    const docClient = DynamoDBService.getDocClient();

    const queryInput: any = {
      TableName: this.tableName,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':sk': 'NOTIFICATION#',
      },
      ScanIndexForward: false, // Descending by default
    };

    const filterExpressions: string[] = [];
    if (filters?.status) {
      filterExpressions.push('status = :status');
      queryInput.ExpressionAttributeValues[':status'] = filters.status;
    }
    if (filters?.severity) {
      filterExpressions.push('severity = :severity');
      queryInput.ExpressionAttributeValues[':severity'] = filters.severity;
    }

    if (filterExpressions.length > 0) {
      queryInput.FilterExpression = filterExpressions.join(' AND ');
    }

    const response = await docClient.send(new QueryCommand(queryInput));
    if (!response.Items) return [];
    return response.Items.map((item) => this.mapItemToNotification(item));
  }

  public async findUnread(userId: string): Promise<Notification[]> {
    const docClient = DynamoDBService.getDocClient();

    // Optimized unread query using GSI5
    const command = new QueryCommand({
      TableName: this.tableName,
      IndexName: 'GSI5',
      KeyConditionExpression: 'GSI5PK = :gsi5pk AND begins_with(GSI5SK, :gsi5sk)',
      ExpressionAttributeValues: {
        ':gsi5pk': `USER#${userId}`,
        ':gsi5sk': 'UNREAD#',
      },
      ScanIndexForward: false, // Descending by default
    });

    const response = await docClient.send(command);
    if (!response.Items) return [];
    return response.Items.map((item) => this.mapItemToNotification(item));
  }

  public async markAllAsRead(userId: string): Promise<number> {
    const unread = await this.findUnread(userId);
    if (unread.length === 0) return 0;

    const now = new Date();
    const docClient = DynamoDBService.getDocClient();

    // Perform individual PUT updates in parallel
    await Promise.all(
      unread.map((n) => {
        return this.update(n.id, { status: 'READ', readAt: now });
      })
    );

    return unread.length;
  }

  public async getSummary(userId: string): Promise<NotificationSummary> {
    const userNotifications = await this.findAll(userId);
    const totalNotifications = userNotifications.length;
    const unreadCount = userNotifications.filter((n) => n.status === 'UNREAD').length;
    const criticalAlertsCount = userNotifications.filter((n) => n.status === 'UNREAD' && n.severity === 'CRITICAL').length;
    
    const recentNotifications = [...userNotifications]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 5);

    return {
      totalNotifications,
      unreadCount,
      criticalAlertsCount,
      recentNotifications,
    };
  }
}
