import { SearchHistoryRecord } from '../../search/interfaces/search.interface';
import { SearchHistoryRepository } from '../interfaces/search-history.interface';
import { DynamoDBService } from '../services/dynamodb.service';
import { PutCommand, GetCommand, QueryCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

export class DynamoDBSearchRepository implements SearchHistoryRepository {
  private static instance: DynamoDBSearchRepository;
  private tableName = DynamoDBService.getTableName();

  private constructor() {}

  public static getInstance(): DynamoDBSearchRepository {
    if (!DynamoDBSearchRepository.instance) {
      DynamoDBSearchRepository.instance = new DynamoDBSearchRepository();
    }
    return DynamoDBSearchRepository.instance;
  }

  private mapItemToRecord(item: any): SearchHistoryRecord {
    return {
      id: item.id,
      userId: item.userId,
      query: item.query,
      frequency: item.frequency || 1,
      lastSearchedAt: new Date(item.lastSearchedAt),
      createdAt: new Date(item.createdAt),
    };
  }

  public async recordSearch(userId: string, query: string): Promise<SearchHistoryRecord> {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      throw new Error('Query cannot be empty');
    }

    const docClient = DynamoDBService.getDocClient();
    const now = new Date();
    
    const key = {
      PK: `USER#${userId}`,
      SK: `SEARCH#${normalizedQuery}`,
    };

    // Check if search record already exists for this query
    const getCommand = new GetCommand({
      TableName: this.tableName,
      Key: key,
    });

    const response = await docClient.send(getCommand);

    if (response.Item) {
      // Increment frequency
      const updateCommand = new UpdateCommand({
        TableName: this.tableName,
        Key: key,
        UpdateExpression: 'SET frequency = frequency + :inc, lastSearchedAt = :now',
        ExpressionAttributeValues: {
          ':inc': 1,
          ':now': now.toISOString(),
        },
        ReturnValues: 'ALL_NEW',
      });

      const updateResponse = await docClient.send(updateCommand);
      return this.mapItemToRecord(updateResponse.Attributes);
    } else {
      // Put new search history item
      const id = uuidv4();
      const newRecord = {
        PK: key.PK,
        SK: key.SK,
        id,
        userId,
        query: query.trim(),
        frequency: 1,
        lastSearchedAt: now.toISOString(),
        createdAt: now.toISOString(),
      };

      const putCommand = new PutCommand({
        TableName: this.tableName,
        Item: newRecord,
      });

      await docClient.send(putCommand);
      return this.mapItemToRecord(newRecord);
    }
  }

  public async recordFailedSearch(userId: string, query: string, reason: string): Promise<void> {
    const id = uuidv4();
    const now = new Date();
    const docClient = DynamoDBService.getDocClient();

    const command = new PutCommand({
      TableName: this.tableName,
      Item: {
        PK: `FAILED_SEARCH#${userId}`,
        SK: `TIMESTAMP#${now.toISOString()}#${id}`,
        userId,
        query: query.trim(),
        reason,
        timestamp: now.toISOString(),
      },
    });

    await docClient.send(command);
  }

  public async getRecent(userId: string, limit = 5): Promise<string[]> {
    const docClient = DynamoDBService.getDocClient();

    const command = new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':sk': 'SEARCH#',
      },
    });

    const response = await docClient.send(command);
    if (!response.Items) return [];

    return response.Items
      .map((item) => this.mapItemToRecord(item))
      .sort((a, b) => b.lastSearchedAt.getTime() - a.lastSearchedAt.getTime())
      .slice(0, limit)
      .map((r) => r.query);
  }

  public async getPopular(limit = 5): Promise<Array<{ query: string; frequency: number }>> {
    const docClient = DynamoDBService.getDocClient();

    // Scan table for search records
    const command = new ScanCommand({
      TableName: this.tableName,
      FilterExpression: 'begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':sk': 'SEARCH#',
      },
    });

    const response = await docClient.send(command);
    if (!response.Items) return [];

    const queryMap = new Map<string, number>();
    response.Items.forEach((item) => {
      const query = item.query.trim();
      const current = queryMap.get(query) || 0;
      queryMap.set(query, current + (item.frequency || 1));
    });

    return Array.from(queryMap.entries())
      .map(([query, frequency]) => ({ query, frequency }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, limit);
  }

  public async getFailedSearches(userId?: string): Promise<Array<{ query: string; reason: string; timestamp: Date }>> {
    const docClient = DynamoDBService.getDocClient();

    if (userId) {
      const command = new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `FAILED_SEARCH#${userId}`,
          ':sk': 'TIMESTAMP#',
        },
      });

      const response = await docClient.send(command);
      if (!response.Items) return [];
      return response.Items.map((item) => ({
        query: item.query,
        reason: item.reason,
        timestamp: new Date(item.timestamp),
      }));
    } else {
      const command = new ScanCommand({
        TableName: this.tableName,
        FilterExpression: 'begins_with(PK, :pk) AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': 'FAILED_SEARCH#',
          ':sk': 'TIMESTAMP#',
        },
      });

      const response = await docClient.send(command);
      if (!response.Items) return [];
      return response.Items.map((item) => ({
        query: item.query,
        reason: item.reason,
        timestamp: new Date(item.timestamp),
      }));
    }
  }

  public async getAllHistory(userId?: string): Promise<SearchHistoryRecord[]> {
    const docClient = DynamoDBService.getDocClient();

    if (userId) {
      const command = new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `USER#${userId}`,
          ':sk': 'SEARCH#',
        },
      });

      const response = await docClient.send(command);
      if (!response.Items) return [];
      return response.Items.map((item) => this.mapItemToRecord(item));
    } else {
      const command = new ScanCommand({
        TableName: this.tableName,
        FilterExpression: 'begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':sk': 'SEARCH#',
        },
      });

      const response = await docClient.send(command);
      if (!response.Items) return [];
      return response.Items.map((item) => this.mapItemToRecord(item));
    }
  }
}
