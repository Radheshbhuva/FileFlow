import {
  Notification,
  NotificationRepository,
  NotificationSummary,
  NotificationStatus,
  NotificationType,
  NotificationSeverity,
  NotificationPreferences
} from '../interfaces/notification.interface';
import { UserRepository } from '../../auth/interfaces/user.interface';
import { RepositoryRegistry } from '../../database/repositories/registry';
import { NotFoundError, ForbiddenError } from '../../../utils/app-error';
import { eventBusService } from '../../realtime/services/event-bus.service';
import { logger } from '../../../config/logger';

export class NotificationService {
  private notificationRepository: NotificationRepository;
  private userRepository: UserRepository;

  constructor(
    notificationRepository: NotificationRepository = RepositoryRegistry.getNotificationRepository(),
    userRepository: UserRepository = RepositoryRegistry.getUserRepository()
  ) {
    this.notificationRepository = notificationRepository;
    this.userRepository = userRepository;
  }

  /**
   * Caching Placeholder Wrapper
   */
  private async getCachedOrCompute<T>(cacheKey: string, computeFn: () => Promise<T>): Promise<T> {
    // Future Redis caching placeholder:
    // const cached = await this.redis.get(cacheKey);
    // if (cached) return JSON.parse(cached);
    return computeFn();
  }

  /**
   * Retrieves user preferences (with default fallback value)
   */
  public async getPreferences(userId: string): Promise<NotificationPreferences> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User profile not found');
    }

    // In a future phase, this will fetch from a preferences database table.
    return {
      userId,
      emailEnabled: true,
      pushEnabled: false,
      inAppEnabled: true,
      securityAlertsEnabled: true,
      storageAlertsEnabled: true,
      activityAlertsEnabled: true,
    };
  }

  /**
   * Updates user preferences (Mock placeholder method)
   */
  public async updatePreferences(userId: string, updates: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    const prefs = await this.getPreferences(userId);
    return { ...prefs, ...updates };
  }

  /**
   * Creates a notification for a user, enforcing user preferences gates
   */
  public async createNotification(
    userId: string,
    dto: {
      notificationType: NotificationType;
      title: string;
      message: string;
      severity: NotificationSeverity;
      metadata?: Record<string, any>;
    }
  ): Promise<Notification | null> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User profile not found');
    }

    const preferences = await this.getPreferences(userId);

    // 1. In-App Notification global gate
    if (!preferences.inAppEnabled) {
      return null;
    }

    // 2. Specific Alert Gates
    if (dto.notificationType === 'STORAGE_WARNING' && !preferences.storageAlertsEnabled) {
      return null;
    }

    if (dto.notificationType === 'SECURITY_ALERT' && !preferences.securityAlertsEnabled) {
      return null;
    }

    const isActivityType = [
      'FILE_UPLOADED',
      'FILE_SHARED',
      'FILE_DOWNLOADED',
      'SHARE_EXPIRED',
      'SHARE_REVOKED',
      'PROFILE_UPDATED',
      'PASSWORD_CHANGED',
    ].includes(dto.notificationType);

    if (isActivityType && !preferences.activityAlertsEnabled) {
      return null;
    }

    // Future Queue and Delivery Worker Integration:
    // await this.notificationQueue.add({ userId, ...dto });

    const notification = await this.notificationRepository.create({
      userId,
      notificationType: dto.notificationType,
      title: dto.title,
      message: dto.message,
      severity: dto.severity,
      metadata: dto.metadata,
      status: 'UNREAD',
    });

    try {
      const workspaceRepo = RepositoryRegistry.getWorkspaceRepository();
      const workspaces = await workspaceRepo.findByOwnerId(userId);
      const workspaceId = workspaces.length > 0 ? workspaces[0].id : userId;

      eventBusService.publishEvent({
        eventType: 'NOTIFICATION_CREATED',
        workspaceId,
        userId,
        payload: notification,
      }).catch((err) => logger.error('Failed to publish real-time notification event:', err));
    } catch (err) {
      logger.error('Failed to resolve workspace for real-time notification event:', err);
    }

    return notification;
  }

  /**
   * Retrieves notifications with optional status filtering
   */
  public async getNotifications(userId: string, status?: NotificationStatus): Promise<Notification[]> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User profile not found');
    }

    return this.getCachedOrCompute(`notifications:list:${userId}:${status || 'all'}`, async () => {
      return this.notificationRepository.findAll(userId, status ? { status } : undefined);
    });
  }

  /**
   * Retrieves unread notifications
   */
  public async getUnreadNotifications(userId: string): Promise<Notification[]> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User profile not found');
    }

    return this.notificationRepository.findUnread(userId);
  }

  /**
   * Retrieves details of a specific notification
   */
  public async getNotification(userId: string, notificationId: string): Promise<Notification> {
    const notification = await this.notificationRepository.findById(notificationId);
    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new ForbiddenError('You do not have permission to access this notification');
    }

    return notification;
  }

  /**
   * Marks a notification as READ, updating readAt timestamp
   */
  public async markAsRead(userId: string, notificationId: string): Promise<Notification> {
    const notification = await this.notificationRepository.findById(notificationId);
    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new ForbiddenError('You do not have permission to modify this notification');
    }

    return this.notificationRepository.update(notificationId, {
      status: 'READ',
      readAt: new Date(),
    });
  }

  /**
   * Marks all UNREAD notifications as READ
   */
  public async markAllAsRead(userId: string): Promise<{ count: number }> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User profile not found');
    }

    const count = await this.notificationRepository.markAllAsRead(userId);
    return { count };
  }

  /**
   * Marks a notification as ARCHIVED
   */
  public async archiveNotification(userId: string, notificationId: string): Promise<Notification> {
    const notification = await this.notificationRepository.findById(notificationId);
    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new ForbiddenError('You do not have permission to archive this notification');
    }

    return this.notificationRepository.update(notificationId, {
      status: 'ARCHIVED',
    });
  }

  /**
   * Gathers notification statistics and recent feed
   */
  public async getSummary(userId: string): Promise<NotificationSummary> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User profile not found');
    }

    return this.notificationRepository.getSummary(userId);
  }
}
