export type RealtimeEventType =
  | 'FILE_UPLOADED'
  | 'FILE_UPDATED'
  | 'FILE_DELETED'
  | 'FILE_SHARED'
  | 'FILE_DOWNLOADED'
  | 'SHARE_REVOKED'
  | 'NOTIFICATION_CREATED'
  | 'WORKSPACE_UPDATED'
  | 'MEMBER_JOINED'
  | 'MEMBER_REMOVED'
  | 'ACTIVITY_CREATED'
  | 'DASHBOARD_UPDATED';

export interface RealtimeEvent {
  id: string;
  eventType: RealtimeEventType;
  workspaceId: string;
  userId: string;
  payload: any;
  timestamp: Date;
}
