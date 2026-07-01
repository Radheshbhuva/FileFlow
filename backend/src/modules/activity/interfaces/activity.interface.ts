export type ActivityType =
  | 'LOGIN'
  | 'LOGOUT'
  | 'REGISTER'
  | 'PROFILE_UPDATED'
  | 'PASSWORD_CHANGED'
  | 'FILE_UPLOADED'
  | 'FILE_UPDATED'
  | 'FILE_DELETED'
  | 'FILE_ARCHIVED'
  | 'FILE_FAVORITED'
  | 'FILE_UNFAVORITED'
  | 'FILE_SHARED'
  | 'FILE_UNSHARED'
  | 'SHARE_CREATED'
  | 'SHARE_REVOKED'
  | 'SHARE_DOWNLOADED'
  | 'UPLOAD_STARTED'
  | 'UPLOAD_COMPLETED'
  | 'UPLOAD_FAILED'
  | 'MEMBER_JOINED'
  | 'MEMBER_REMOVED'
  | 'ROLE_CHANGED'
  | 'INVITATION_ACCEPTED'
  | 'WORKSPACE_UPDATED'
  | 'WORKSPACE_CREATED';

export type ActivitySeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface Activity {
  id: string;
  userId?: string;
  activityType: ActivityType;
  resourceType?: string;
  resourceId?: string;
  resourceName?: string;
  description: string;
  metadata?: Record<string, any>;
  severity: ActivitySeverity;
  createdAt: Date;
}

export interface ListActivityFilters {
  activityType?: ActivityType;
  severity?: ActivitySeverity;
  resourceType?: string;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

export interface ListActivityPagination {
  page: number;
  limit: number;
}

export interface ActivityRepository {
  create(activity: Omit<Activity, 'id' | 'createdAt'>): Promise<Activity>;
  findById(id: string): Promise<Activity | null>;
  findAll(
    filters: ListActivityFilters,
    pagination: ListActivityPagination
  ): Promise<{ activities: Activity[]; total: number }>;
  findRecent(userId?: string, limit?: number): Promise<Activity[]>;
  getSummary(userId?: string): Promise<{
    totalActivities: number;
    uploads: number;
    shares: number;
    downloads: number;
    profileChanges: number;
    recentActivityCount: number;
  }>;
}
