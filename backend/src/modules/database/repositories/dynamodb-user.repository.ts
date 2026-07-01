import { User, UserRepository } from '../../auth/interfaces/user.interface';
import { DynamoDBService } from '../services/dynamodb.service';
import { PutCommand, GetCommand, UpdateCommand, DeleteCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

export class DynamoDBUserRepository implements UserRepository {
  private static instance: DynamoDBUserRepository;
  private tableName = DynamoDBService.getTableName();

  private constructor() {}

  public static getInstance(): DynamoDBUserRepository {
    if (!DynamoDBUserRepository.instance) {
      DynamoDBUserRepository.instance = new DynamoDBUserRepository();
    }
    return DynamoDBUserRepository.instance;
  }

  /**
   * Helper to map DynamoDB item back to User object with proper Dates
   */
  private mapItemToUser(item: any): User {
    return {
      id: item.id,
      fullName: item.fullName,
      email: item.email,
      passwordHash: item.passwordHash,
      role: item.role,
      planType: item.planType,
      emailVerified: item.emailVerified,
      accountStatus: item.accountStatus,
      storageUsed: item.storageUsed || 0,
      storageLimit: item.storageLimit || 0,
      avatar: item.avatar,
      timezone: item.timezone,
      company: item.company,
      jobTitle: item.jobTitle,
      filesUploadedCount: item.filesUploadedCount || 0,
      filesSharedCount: item.filesSharedCount || 0,
      favoritesCount: item.favoritesCount || 0,
      recentActivityCount: item.recentActivityCount || 0,
      verificationToken: item.verificationToken,
      verificationTokenExpiresAt: item.verificationTokenExpiresAt ? new Date(item.verificationTokenExpiresAt) : undefined,
      resetPasswordToken: item.resetPasswordToken,
      resetPasswordExpiresAt: item.resetPasswordExpiresAt ? new Date(item.resetPasswordExpiresAt) : undefined,
      cognitoSub: item.cognitoSub,
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt),
      lastLogin: item.lastLogin ? new Date(item.lastLogin) : undefined,
    };
  }

  /**
   * Helper to marshal User object fields to DynamoDB format
   */
  private marshalUser(user: Partial<User>): Record<string, any> {
    const marshalled: Record<string, any> = { ...user };
    
    if (user.createdAt instanceof Date) marshalled.createdAt = user.createdAt.toISOString();
    if (user.updatedAt instanceof Date) marshalled.updatedAt = user.updatedAt.toISOString();
    if (user.lastLogin instanceof Date) marshalled.lastLogin = user.lastLogin.toISOString();
    if (user.verificationTokenExpiresAt instanceof Date) marshalled.verificationTokenExpiresAt = user.verificationTokenExpiresAt.toISOString();
    if (user.resetPasswordExpiresAt instanceof Date) marshalled.resetPasswordExpiresAt = user.resetPasswordExpiresAt.toISOString();
    
    return marshalled;
  }

  public async findById(id: string): Promise<User | null> {
    const docClient = DynamoDBService.getDocClient();
    const command = new GetCommand({
      TableName: this.tableName,
      Key: {
        PK: `USER#${id}`,
        SK: 'PROFILE',
      },
    });

    const response = await docClient.send(command);
    if (!response.Item) return null;
    return this.mapItemToUser(response.Item);
  }

  public async findByEmail(email: string): Promise<User | null> {
    const docClient = DynamoDBService.getDocClient();
    const normalizedEmail = email.toLowerCase().trim();

    const command = new QueryCommand({
      TableName: this.tableName,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :gsi1pk AND GSI1SK = :gsi1sk',
      ExpressionAttributeValues: {
        ':gsi1pk': `USER_EMAIL#${normalizedEmail}`,
        ':gsi1sk': 'PROFILE',
      },
    });

    const response = await docClient.send(command);
    if (!response.Items || response.Items.length === 0) return null;
    return this.mapItemToUser(response.Items[0]);
  }

  public async findByVerificationToken(token: string): Promise<User | null> {
    const docClient = DynamoDBService.getDocClient();

    // Query helper pointer item PK = VERIFICATION_TOKEN#token
    const command = new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `VERIFICATION_TOKEN#${token}`,
        ':sk': 'USER#',
      },
    });

    const response = await docClient.send(command);
    if (!response.Items || response.Items.length === 0) return null;

    const pointer = response.Items[0];
    const userId = pointer.userId;
    return this.findById(userId);
  }

  public async findByResetToken(token: string): Promise<User | null> {
    const docClient = DynamoDBService.getDocClient();

    // Query helper pointer item PK = RESET_TOKEN#token
    const command = new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `RESET_TOKEN#${token}`,
        ':sk': 'USER#',
      },
    });

    const response = await docClient.send(command);
    if (!response.Items || response.Items.length === 0) return null;

    const pointer = response.Items[0];
    const userId = pointer.userId;
    return this.findById(userId);
  }

  public async create(
    userData: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'storageUsed' | 'storageLimit'>
  ): Promise<User> {
    const id = uuidv4();
    const now = new Date();
    const newUser: User = {
      ...userData,
      id,
      storageUsed: 0,
      storageLimit: 5 * 1024 * 1024 * 1024, // Default 5 GB
      timezone: 'UTC',
      company: '',
      jobTitle: '',
      filesUploadedCount: 0,
      filesSharedCount: 0,
      favoritesCount: 0,
      recentActivityCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    const docClient = DynamoDBService.getDocClient();
    const marshalledUser = this.marshalUser(newUser);

    // Primary record Put
    const putUserCommand = new PutCommand({
      TableName: this.tableName,
      Item: {
        PK: `USER#${id}`,
        SK: 'PROFILE',
        GSI1PK: `USER_EMAIL#${newUser.email.toLowerCase().trim()}`,
        GSI1SK: 'PROFILE',
        ...marshalledUser,
      },
    });

    await docClient.send(putUserCommand);

    // If verification token is present, put the pointer record
    if (newUser.verificationToken) {
      const putTokenCommand = new PutCommand({
        TableName: this.tableName,
        Item: {
          PK: `VERIFICATION_TOKEN#${newUser.verificationToken}`,
          SK: `USER#${id}`,
          userId: id,
          createdAt: now.toISOString(),
        },
      });
      await docClient.send(putTokenCommand);
    }

    return newUser;
  }

  public async update(id: string, updates: Partial<User>): Promise<User> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error(`User with ID ${id} not found`);
    }

    const updatedUser: User = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };

    const docClient = DynamoDBService.getDocClient();
    const marshalledUser = this.marshalUser(updatedUser);

    // Put updated item (since we're performing a full replacement under USER#id, SK=PROFILE)
    const command = new PutCommand({
      TableName: this.tableName,
      Item: {
        PK: `USER#${id}`,
        SK: 'PROFILE',
        GSI1PK: `USER_EMAIL#${updatedUser.email.toLowerCase().trim()}`,
        GSI1SK: 'PROFILE',
        ...marshalledUser,
      },
    });

    await docClient.send(command);

    // Handle verification or reset tokens pointers updates if they were added/removed
    if (updates.verificationToken && updates.verificationToken !== existing.verificationToken) {
      const putTokenCommand = new PutCommand({
        TableName: this.tableName,
        Item: {
          PK: `VERIFICATION_TOKEN#${updates.verificationToken}`,
          SK: `USER#${id}`,
          userId: id,
          createdAt: new Date().toISOString(),
        },
      });
      await docClient.send(putTokenCommand);
    }

    if (updates.resetPasswordToken && updates.resetPasswordToken !== existing.resetPasswordToken) {
      const putResetCommand = new PutCommand({
        TableName: this.tableName,
        Item: {
          PK: `RESET_TOKEN#${updates.resetPasswordToken}`,
          SK: `USER#${id}`,
          userId: id,
          createdAt: new Date().toISOString(),
        },
      });
      await docClient.send(putResetCommand);
    }

    return updatedUser;
  }

  public async delete(id: string): Promise<boolean> {
    const user = await this.findById(id);
    if (!user) return false;

    const docClient = DynamoDBService.getDocClient();
    const command = new DeleteCommand({
      TableName: this.tableName,
      Key: {
        PK: `USER#${id}`,
        SK: 'PROFILE',
      },
    });

    await docClient.send(command);

    // Clean up verification token pointer
    if (user.verificationToken) {
      await docClient.send(new DeleteCommand({
        TableName: this.tableName,
        Key: {
          PK: `VERIFICATION_TOKEN#${user.verificationToken}`,
          SK: `USER#${id}`,
        },
      }));
    }

    // Clean up reset token pointer
    if (user.resetPasswordToken) {
      await docClient.send(new DeleteCommand({
        TableName: this.tableName,
        Key: {
          PK: `RESET_TOKEN#${user.resetPasswordToken}`,
          SK: `USER#${id}`,
        },
      }));
    }

    return true;
  }
}
