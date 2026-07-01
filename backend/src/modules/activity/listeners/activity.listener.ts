import { eventBus } from '../../../shared/event-bus';
import { uploadEventEmitter } from '../../uploads/services/upload.service';
import { shareEventEmitter } from '../../shares/services/share.service';
import { ActivityService } from '../services/activity.service';

export class ActivityListener {
  private activityService: ActivityService;

  constructor(activityService: ActivityService = new ActivityService()) {
    this.activityService = activityService;
  }

  public initialize(): void {
    // --- Auth & User Events ---
    eventBus.on('user.registered', async (data) => {
      await this.activityService.createActivity({
        userId: data.userId,
        activityType: 'REGISTER',
        description: 'User registered successfully',
        severity: 'INFO',
        resourceType: 'USER',
        resourceId: data.userId,
      });
    });

    eventBus.on('user.logged_in', async (data) => {
      await this.activityService.createActivity({
        userId: data.userId,
        activityType: 'LOGIN',
        description: 'User logged in successfully',
        severity: 'INFO',
        resourceType: 'USER',
        resourceId: data.userId,
      });
    });

    eventBus.on('user.logged_out', async (data) => {
      await this.activityService.createActivity({
        userId: data.userId,
        activityType: 'LOGOUT',
        description: 'User logged out successfully',
        severity: 'WARNING',
        resourceType: 'USER',
        resourceId: data.userId,
      });
    });

    eventBus.on('user.profile_updated', async (data) => {
      await this.activityService.createActivity({
        userId: data.userId,
        activityType: 'PROFILE_UPDATED',
        description: 'User profile updated',
        severity: 'INFO',
        resourceType: 'USER',
        resourceId: data.userId,
      });
    });

    eventBus.on('user.password_changed', async (data) => {
      await this.activityService.createActivity({
        userId: data.userId,
        activityType: 'PASSWORD_CHANGED',
        description: 'User password changed successfully',
        severity: 'CRITICAL',
        resourceType: 'USER',
        resourceId: data.userId,
      });
    });

    // --- File Events ---
    eventBus.on('file.created', async (data) => {
      await this.activityService.createActivity({
        userId: data.userId,
        activityType: 'FILE_UPLOADED',
        description: `File created: ${data.fileName}`,
        severity: 'INFO',
        resourceType: 'FILE',
        resourceId: data.fileId,
        resourceName: data.fileName,
      });
    });

    eventBus.on('file.updated', async (data) => {
      await this.activityService.createActivity({
        userId: data.userId,
        activityType: 'FILE_UPDATED',
        description: `File updated: ${data.fileName}`,
        severity: 'INFO',
        resourceType: 'FILE',
        resourceId: data.fileId,
        resourceName: data.fileName,
      });
    });

    eventBus.on('file.deleted', async (data) => {
      await this.activityService.createActivity({
        userId: data.userId,
        activityType: 'FILE_DELETED',
        description: `File deleted: ${data.fileName}`,
        severity: 'WARNING',
        resourceType: 'FILE',
        resourceId: data.fileId,
        resourceName: data.fileName,
      });
    });

    eventBus.on('file.favorited', async (data) => {
      await this.activityService.createActivity({
        userId: data.userId,
        activityType: 'FILE_FAVORITED',
        description: `File favorited: ${data.fileName}`,
        severity: 'INFO',
        resourceType: 'FILE',
        resourceId: data.fileId,
        resourceName: data.fileName,
      });
    });

    eventBus.on('file.unfavorited', async (data) => {
      await this.activityService.createActivity({
        userId: data.userId,
        activityType: 'FILE_UNFAVORITED',
        description: `File unfavorited: ${data.fileName}`,
        severity: 'INFO',
        resourceType: 'FILE',
        resourceId: data.fileId,
        resourceName: data.fileName,
      });
    });

    eventBus.on('file.archived', async (data) => {
      await this.activityService.createActivity({
        userId: data.userId,
        activityType: 'FILE_ARCHIVED',
        description: data.archive ? `File archived: ${data.fileName}` : `File restored: ${data.fileName}`,
        severity: 'WARNING',
        resourceType: 'FILE',
        resourceId: data.fileId,
        resourceName: data.fileName,
      });
    });

    // --- Upload Module Events Bridge ---
    uploadEventEmitter.on('uploadStarted', async (data) => {
      await this.activityService.createActivity({
        userId: data.userId,
        activityType: 'UPLOAD_STARTED',
        description: 'File upload started',
        severity: 'INFO',
        resourceType: 'UPLOAD',
        resourceId: data.uploadId,
      });
    });

    uploadEventEmitter.on('uploadCompleted', async (data) => {
      await this.activityService.createActivity({
        userId: data.userId,
        activityType: 'UPLOAD_COMPLETED',
        description: 'File upload completed successfully',
        severity: 'INFO',
        resourceType: 'UPLOAD',
        resourceId: data.uploadId,
      });
    });

    uploadEventEmitter.on('uploadFailed', async (data) => {
      await this.activityService.createActivity({
        userId: data.userId,
        activityType: 'UPLOAD_FAILED',
        description: `File upload failed: ${data.error}`,
        severity: 'WARNING',
        resourceType: 'UPLOAD',
        resourceId: data.uploadId,
      });
    });

    // --- Share Module Events Bridge ---
    shareEventEmitter.on('shareCreated', async (data) => {
      await this.activityService.createActivity({
        userId: data.ownerId,
        activityType: 'SHARE_CREATED',
        description: 'Secure share link generated',
        severity: 'INFO',
        resourceType: 'SHARE',
        resourceId: data.shareId,
      });
    });

    shareEventEmitter.on('shareRevoked', async (data) => {
      await this.activityService.createActivity({
        userId: data.ownerId,
        activityType: 'SHARE_REVOKED',
        description: 'Share link access revoked',
        severity: 'WARNING',
        resourceType: 'SHARE',
        resourceId: data.shareId,
      });
    });

    shareEventEmitter.on('shareDownloaded', async (data) => {
      // Shared downloads might be anonymous, so userId could be undefined/missing
      await this.activityService.createActivity({
        userId: data.userId,
        activityType: 'SHARE_DOWNLOADED',
        description: 'Shared file downloaded by recipient',
        severity: 'INFO',
        resourceType: 'SHARE',
        resourceId: data.shareId,
      });
    });
  }
}
