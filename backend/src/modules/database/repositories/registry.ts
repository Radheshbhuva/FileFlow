import { UserRepository } from '../../auth/interfaces/user.interface';
import { InMemoryUserRepository } from '../../auth/repositories/user.repository';
import { DynamoDBUserRepository } from './dynamodb-user.repository';

import { WorkspaceRepository } from '../interfaces/workspace.interface';
import { InMemoryWorkspaceRepository } from './inmemory-workspace.repository';
import { DynamoDBWorkspaceRepository } from './dynamodb-workspace.repository';

import { FileRepository } from '../../files/interfaces/file.interface';
import { InMemoryFileRepository } from '../../files/repositories/file.repository';
import { DynamoDBFileRepository } from './dynamodb-file.repository';

import { ShareRepository } from '../../shares/interfaces/share.interface';
import { InMemoryShareRepository } from '../../shares/repositories/share.repository';
import { DynamoDBShareRepository } from './dynamodb-share.repository';

import { ActivityRepository } from '../../activity/interfaces/activity.interface';
import { InMemoryActivityRepository } from '../../activity/repositories/activity.repository';
import { DynamoDBActivityRepository } from './dynamodb-activity.repository';

import { NotificationRepository } from '../../notifications/interfaces/notification.interface';
import { InMemoryNotificationRepository } from '../../notifications/repositories/notification.repository';
import { DynamoDBNotificationRepository } from './dynamodb-notification.repository';

import { UploadRepository } from '../../uploads/interfaces/upload.interface';
import { InMemoryUploadRepository } from '../../uploads/repositories/upload.repository';
import { DynamoDBUploadRepository } from './dynamodb-upload.repository';

import { SearchHistoryRepository } from '../interfaces/search-history.interface';
import { InMemorySearchHistoryRepository } from '../../search/repositories/search.repository';
import { DynamoDBSearchRepository } from './dynamodb-search.repository';

import dotenv from 'dotenv';
dotenv.config();

export class RepositoryRegistry {
  private constructor() {}

  /**
   * Retrieves the active UserRepository implementation
   */
  public static getUserRepository(): UserRepository {
    if (process.env.DB_TYPE === 'dynamodb') {
      return DynamoDBUserRepository.getInstance();
    }
    return InMemoryUserRepository.getInstance();
  }

  /**
   * Retrieves the active WorkspaceRepository implementation
   */
  public static getWorkspaceRepository(): WorkspaceRepository {
    if (process.env.DB_TYPE === 'dynamodb') {
      return DynamoDBWorkspaceRepository.getInstance();
    }
    return InMemoryWorkspaceRepository.getInstance();
  }

  /**
   * Retrieves the active FileRepository implementation
   */
  public static getFileRepository(): FileRepository {
    if (process.env.DB_TYPE === 'dynamodb') {
      return DynamoDBFileRepository.getInstance();
    }
    return InMemoryFileRepository.getInstance();
  }

  /**
   * Retrieves the active ShareRepository implementation
   */
  public static getShareRepository(): ShareRepository {
    if (process.env.DB_TYPE === 'dynamodb') {
      return DynamoDBShareRepository.getInstance();
    }
    return InMemoryShareRepository.getInstance();
  }

  /**
   * Retrieves the active ActivityRepository implementation
   */
  public static getActivityRepository(): ActivityRepository {
    if (process.env.DB_TYPE === 'dynamodb') {
      return DynamoDBActivityRepository.getInstance();
    }
    return InMemoryActivityRepository.getInstance();
  }

  /**
   * Retrieves the active NotificationRepository implementation
   */
  public static getNotificationRepository(): NotificationRepository {
    if (process.env.DB_TYPE === 'dynamodb') {
      return DynamoDBNotificationRepository.getInstance();
    }
    return InMemoryNotificationRepository.getInstance();
  }

  /**
   * Retrieves the active UploadRepository implementation
   */
  public static getUploadRepository(): UploadRepository {
    if (process.env.DB_TYPE === 'dynamodb') {
      return DynamoDBUploadRepository.getInstance();
    }
    return InMemoryUploadRepository.getInstance();
  }

  /**
   * Retrieves the active SearchHistoryRepository implementation
   */
  public static getSearchHistoryRepository(): SearchHistoryRepository {
    if (process.env.DB_TYPE === 'dynamodb') {
      return DynamoDBSearchRepository.getInstance();
    }
    // Cast InMemory search history repo to implement the new interface
    return InMemorySearchHistoryRepository.getInstance() as any as SearchHistoryRepository;
  }
}
