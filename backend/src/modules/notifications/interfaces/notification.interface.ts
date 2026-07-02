export type NotificationType =
  | 'FILE_UPLOADED'
  | 'FILE_SHARED'
  | 'FILE_DOWNLOADED'
  | 'SHARE_EXPIRED'
  | 'SHARE_REVOKED'
  | 'SECURITY_ALERT'
  | 'STORAGE_WARNING'
  | 'PROFILE_UPDATED'
  | 'PASSWORD_CHANGED'
  | 'SYSTEM_MESSAGE';

export type NotificationSeverity = 'INFO' | 'SUCCESS' | 'WARNING' | 'CRITICAL';

export type NotificationStatus = 'UNREAD' | 'READ' | 'ARCHIVED';

export interface Notification {
  id: string;
  userId: string;
  notificationType: NotificationType;
  title: string;
  message: string;
  severity: NotificationSeverity;
  status: NotificationStatus;
  metadata?: Record<string, any>;
  createdAt: Date;
  readAt?: Date;
}

export interface NotificationSummary {
  totalNotifications: number;
  unreadCount: number;
  criticalAlertsCount: number;
  recentNotifications: Notification[];
}

export interface NotificationPreferences {
  userId: string;
  emailEnabled: boolean;
  pushEnabled: boolean;
  inAppEnabled: boolean;
  securityAlertsEnabled: boolean;
  storageAlertsEnabled: boolean;
  activityAlertsEnabled: boolean;
}

export interface NotificationRepository {
  create(notification: Omit<Notification, 'id' | 'createdAt' | 'status'> & { status?: NotificationStatus }): Promise<Notification>;
  findById(id: string): Promise<Notification | null>;
  update(id: string, updates: Partial<Notification>): Promise<Notification>;
  findAll(userId: string, filters?: { status?: NotificationStatus; severity?: NotificationSeverity }): Promise<Notification[]>;
  findUnread(userId: string): Promise<Notification[]>;
  markAllAsRead(userId: string): Promise<number>;
  getSummary(userId: string): Promise<NotificationSummary>;
}

// ==========================================
// Future Real-Time & Email Delivery Schemas
// ==========================================

export interface RealTimeChannel {
  send(userId: string, notification: Notification): Promise<void>;
  broadcast(notification: Notification): Promise<void>;
  connect(userId: string, socketId: string): void;
  disconnect(userId: string, socketId: string): void;
}

export interface EmailDeliveryProvider {
  sendEmail(
    to: string,
    subject: string,
    templateName: string,
    context: Record<string, any>
  ): Promise<{ success: boolean; messageId?: string }>;
}
