import { Notification, NotificationRepository, NotificationSummary, NotificationStatus, NotificationSeverity } from '../interfaces/notification.interface';
import { v4 as uuidv4 } from 'uuid';

export class InMemoryNotificationRepository implements NotificationRepository {
  private notifications: Notification[] = [];
  private static instance: InMemoryNotificationRepository;

  private constructor() {}

  public static getInstance(): InMemoryNotificationRepository {
    if (!InMemoryNotificationRepository.instance) {
      InMemoryNotificationRepository.instance = new InMemoryNotificationRepository();
    }
    return InMemoryNotificationRepository.instance;
  }

  public clear(): void {
    this.notifications = [];
  }

  public async create(data: Omit<Notification, 'id' | 'createdAt' | 'status'> & { status?: NotificationStatus }): Promise<Notification> {
    const now = new Date();
    const newNotification: Notification = {
      ...data,
      id: uuidv4(),
      status: data.status || 'UNREAD',
      createdAt: now,
    };
    
    this.notifications.push(newNotification);
    return { ...newNotification };
  }

  public async findById(id: string): Promise<Notification | null> {
    const item = this.notifications.find((n) => n.id === id);
    return item ? { ...item } : null;
  }

  public async update(id: string, updates: Partial<Notification>): Promise<Notification> {
    const index = this.notifications.findIndex((n) => n.id === id);
    if (index === -1) {
      throw new Error(`Notification with ID ${id} not found`);
    }

    const current = this.notifications[index];
    const nextStatus = updates.status || current.status;
    let readAt = updates.readAt || current.readAt;

    if (updates.status === 'READ' && current.status === 'UNREAD' && !readAt) {
      readAt = new Date();
    }

    const updated: Notification = {
      ...current,
      ...updates,
      status: nextStatus,
      readAt,
    };

    this.notifications[index] = updated;
    return { ...updated };
  }

  public async findAll(userId: string, filters?: { status?: NotificationStatus; severity?: NotificationSeverity }): Promise<Notification[]> {
    let list = this.notifications.filter((n) => n.userId === userId);
    
    if (filters?.status) {
      list = list.filter((n) => n.status === filters.status);
    }
    
    if (filters?.severity) {
      list = list.filter((n) => n.severity === filters.severity);
    }

    return list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).map((n) => ({ ...n }));
  }

  public async findUnread(userId: string): Promise<Notification[]> {
    return this.findAll(userId, { status: 'UNREAD' });
  }

  public async markAllAsRead(userId: string): Promise<number> {
    const unread = this.notifications.filter((n) => n.userId === userId && n.status === 'UNREAD');
    const now = new Date();
    
    unread.forEach((n) => {
      n.status = 'READ';
      n.readAt = now;
    });

    return unread.length;
  }

  public async getSummary(userId: string): Promise<NotificationSummary> {
    const userNotifications = this.notifications.filter((n) => n.userId === userId);
    const totalNotifications = userNotifications.length;
    const unreadCount = userNotifications.filter((n) => n.status === 'UNREAD').length;
    const criticalAlertsCount = userNotifications.filter((n) => n.status === 'UNREAD' && n.severity === 'CRITICAL').length;
    
    const recentNotifications = [...userNotifications]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 5)
      .map((n) => ({ ...n }));

    return {
      totalNotifications,
      unreadCount,
      criticalAlertsCount,
      recentNotifications,
    };
  }
}
