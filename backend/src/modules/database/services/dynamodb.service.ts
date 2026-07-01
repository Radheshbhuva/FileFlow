import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import dotenv from 'dotenv';

dotenv.config();

export class DynamoDBService {
  private static clientInstance: DynamoDBClient;
  private static docClientInstance: DynamoDBDocumentClient;
  private static tableName: string = process.env.DYNAMODB_TABLE_NAME || 'FileFlow';

  private constructor() {}

  /**
   * Returns the DynamoDBClient singleton instance
   */
  public static getClient(): DynamoDBClient {
    if (!this.clientInstance) {
      const region = process.env.AWS_REGION || 'us-east-1';
      const endpoint = process.env.DYNAMODB_ENDPOINT;
      
      const config: any = {
        region,
      };

      if (endpoint) {
        config.endpoint = endpoint;
      }

      // Add fallback credentials to prevent sdk loading failure if credentials are not in environment
      if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
        config.credentials = {
          accessKeyId: 'dummy-access-key-id',
          secretAccessKey: 'dummy-secret-key-id',
        };
      } else {
        config.credentials = {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        };
      }

      this.clientInstance = new DynamoDBClient(config);
    }
    return this.clientInstance;
  }

  /**
   * Returns the DynamoDBDocumentClient singleton instance
   */
  public static getDocClient(): DynamoDBDocumentClient {
    if (!this.docClientInstance) {
      const client = this.getClient();
      this.docClientInstance = DynamoDBDocumentClient.from(client, {
        marshallOptions: {
          convertEmptyValues: true,
          removeUndefinedValues: true,
          convertClassInstanceToMap: true,
        },
        unmarshallOptions: {
          wrapNumbers: false,
        },
      });
    }
    return this.docClientInstance;
  }

  /**
   * Gets the configured single-table name
   */
  public static getTableName(): string {
    return this.tableName;
  }
}
