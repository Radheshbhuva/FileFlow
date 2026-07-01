import { Activity, ActivityRepository, ListActivityFilters, ListActivityPagination } from '../../activity/interfaces/activity.interface';
import { DynamoDBService } from '../services/dynamodb.service';
import { PutCommand, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

export class DynamoDBActivityRepository implements ActivityRepository {
  private static instance: DynamoDBActivityRepository;
  private tableName = DynamoDBService.getTableName();

  private constructor() {}

  public static getInstance(): DynamoDBActivityRepository {
    if (!DynamoDBActivityRepository.instance) {
      DynamoDBActivityRepository.instance = new DynamoDBActivityRepository();
    }
    return DynamoDBActivityRepository.instance;
  }

  private mapItemToActivity(item: any): Activity {
    return {
      id: item.id,
      userId: item.userId,
      activityType: item.activityType,
      resourceType: item.resourceType,
      resourceId: item.resourceId,
      resourceName: item.resourceName,
      description: item.description,
      severity: item.severity,
      metadata: item.metadata,
      createdAt: new Date(item.createdAt),
    };
  }

  private marshalActivity(activity: Partial<Activity>): Record<string, any> {
    const marshalled: Record<string, any> = { ...activity };
    if (activity.createdAt instanceof Date) marshalled.createdAt = activity.createdAt.toISOString();
    return marshalled;
  }

  public async create(activityData: Omit<Activity, 'id' | 'createdAt'>): Promise<Activity> {
    const id = uuidv4();
    const now = new Date();
    const newActivity: Activity = {
      ...activityData,
      id,
      createdAt: now,
    };

    const docClient = DynamoDBService.getDocClient();
    const marshalled = this.marshalActivity(newActivity);
    const userId = newActivity.userId || 'GLOBAL';

    const command = new PutCommand({
      TableName: this.tableName,
      Item: {
        PK: `USER#${userId}`,
        SK: `ACTIVITY#${now.toISOString()}#${id}`,
        GSI3PK: `ACTIVITY#${id}`,
        GSI3SK: `USER#${userId}`,
        GSI4PK: 'ACTIVITY',
        GSI4SK: now.toISOString(),
        ...marshalled,
      },
    });

    await docClient.send(command);
    return newActivity;
  }

  public async findById(id: string): Promise<Activity | null> {
    const docClient = DynamoDBService.getDocClient();

    // Look up fileId/userId in GSI3
    const queryGsi = new QueryCommand({
      TableName: this.tableName,
      IndexName: 'GSI3',
      KeyConditionExpression: 'GSI3PK = :gsi3pk',
      ExpressionAttributeValues: {
        ':gsi3pk': `ACTIVITY#${id}`,
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
    return this.mapItemToActivity(response.Item);
  }

  public async findAll(
    filters: ListActivityFilters,
    pagination: ListActivityPagination
  ): Promise<{ activities: Activity[]; total: number }> {
    const docClient = DynamoDBService.getDocClient();
    let response: any;

    if (filters.userId) {
      // Query specific user's activities
      const queryInput: any = {
        TableName: this.tableName,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `USER#${filters.userId}`,
          ':sk': 'ACTIVITY#',
        },
        ScanIndexForward: false, // Descending by default
      };

      this.appendActivityFilters(queryInput, filters);
      response = await docClient.send(new QueryCommand(queryInput));
    } else {
      // Query global activity index
      const queryInput: any = {
        TableName: this.tableName,
        IndexName: 'GSI4',
        KeyConditionExpression: 'GSI4PK = :gsi4pk',
        ExpressionAttributeValues: {
          ':gsi4pk': 'ACTIVITY',
        },
        ScanIndexForward: false, // Descending by default
      };

      this.appendActivityFilters(queryInput, filters);
      response = await docClient.send(new QueryCommand(queryInput));
    }

    if (!response.Items) return { activities: [], total: 0 };

    let results: Activity[] = response.Items.map((item: any) => this.mapItemToActivity(item));

    // Substring match in description or metadata
    if (filters.search) {
      const q = filters.search.toLowerCase();
      results = results.filter((a) => a.description.toLowerCase().includes(q));
    }

    const total = results.length;
    
    // Paginate
    const { page, limit } = pagination;
    const startIndex = (page - 1) * limit;
    const paginated = results.slice(startIndex, startIndex + limit);

    return {
      activities: paginated,
      total,
    };
  }

  private appendActivityFilters(queryInput: any, filters: ListActivityFilters): void {
    const filterExpressions: string[] = [];
    queryInput.ExpressionAttributeValues = queryInput.ExpressionAttributeValues || {};

    if (filters.activityType) {
      filterExpressions.push('activityType = :activityType');
      queryInput.ExpressionAttributeValues[':activityType'] = filters.activityType;
    }

    if (filters.severity) {
      filterExpressions.push('severity = :severity');
      queryInput.ExpressionAttributeValues[':severity'] = filters.severity;
    }

    if (filters.resourceType) {
      filterExpressions.push('resourceType = :resourceType');
      queryInput.ExpressionAttributeValues[':resourceType'] = filters.resourceType;
    }

    if (filters.startDate) {
      filterExpressions.push('createdAt >= :startDate');
      queryInput.ExpressionAttributeValues[':startDate'] = filters.startDate.toISOString();
    }

    if (filters.endDate) {
      filterExpressions.push('createdAt <= :endDate');
      queryInput.ExpressionAttributeValues[':endDate'] = filters.endDate.toISOString();
    }

    if (filterExpressions.length > 0) {
      queryInput.FilterExpression = filterExpressions.join(' AND ');
    }
  }

  public async findRecent(userId?: string, limit = 10): Promise<Activity[]> {
    const docClient = DynamoDBService.getDocClient();

    if (userId) {
      const command = new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `USER#${userId}`,
          ':sk': 'ACTIVITY#',
        },
        ScanIndexForward: false,
        Limit: limit,
      });

      const response = await docClient.send(command);
      if (!response.Items) return [];
      return response.Items.map((item) => this.mapItemToActivity(item));
    } else {
      const command = new QueryCommand({
        TableName: this.tableName,
        IndexName: 'GSI4',
        KeyConditionExpression: 'GSI4PK = :gsi4pk',
        ExpressionAttributeValues: {
          ':gsi4pk': 'ACTIVITY',
        },
        ScanIndexForward: false,
        Limit: limit,
      });

      const response = await docClient.send(command);
      if (!response.Items) return [];
      return response.Items.map((item) => this.mapItemToActivity(item));
    }
  }

  public async getSummary(userId?: string): Promise<{
    totalActivities: number;
    uploads: number;
    shares: number;
    downloads: number;
    profileChanges: number;
    recentActivityCount: number;
  }> {
    // Retrieve past activities to calculate stats
    const activities = await this.findRecent(userId, 5000);
    const totalActivities = activities.length;

    const uploads = activities.filter((a) => a.activityType === 'FILE_UPLOADED').length;
    const shares = activities.filter((a) => a.activityType === 'SHARE_CREATED' || a.activityType === 'FILE_SHARED').length;
    const downloads = activities.filter((a) => a.activityType === 'SHARE_DOWNLOADED').length;
    const profileChanges = activities.filter((a) => a.activityType === 'PROFILE_UPDATED').length;

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentActivityCount = activities.filter((a) => a.createdAt >= sevenDaysAgo).length;

    return {
      totalActivities,
      uploads,
      shares,
      downloads,
      profileChanges,
      recentActivityCount,
    };
  }
}
