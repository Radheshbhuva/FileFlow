import { eventBus } from '../../../shared/event-bus';
import { uploadEventEmitter } from '../../uploads/services/upload.service';
import { shareEventEmitter } from '../../shares/services/share.service';
import { NotificationService } from '../services/notification.service';
import { FileRepository } from '../../files/interfaces/file.interface';
import { ShareRepository } from '../../shares/interfaces/share.interface';
import { UserRepository } from '../../auth/interfaces/user.interface';
import { RepositoryRegistry } from '../../database/repositories/registry';

export class NotificationListener {
  private notificationService: NotificationService;
  private fileRepository: FileRepository;
  private shareRepository: ShareRepository;
  private userRepository: UserRepository;

  constructor(
    notificationService: NotificationService = new NotificationService(),
    fileRepository: FileRepository = RepositoryRegistry.getFileRepository(),
    shareRepository: ShareRepository = RepositoryRegistry.getShareRepository(),
    userRepository: UserRepository = RepositoryRegistry.getUserRepository()
  ) {
    this.notificationService = notificationService;
    this.fileRepository = fileRepository;
    this.shareRepository = shareRepository;
    this.userRepository = userRepository;
  }

  /**
   * Helper to check and generate storage alert threshold warnings
   */
  private async evaluateStorageAlerts(userId: string): Promise<void> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) return;

      const limit = user.storageLimit || 5 * 1024 * 1024 * 1024;
      const used = user.storageUsed || 0;
      const pct = (used / limit) * 100;

      // Unread notifications of the user
      const unreadAlerts = await this.notificationService.getNotifications(userId, 'UNREAD');
      const hasRecentStorageAlert = unreadAlerts.some((n) => n.notificationType === 'STORAGE_WARNING');

      // Only alert if there is no pending unread storage warning to prevent alert spamming
      if (!hasRecentStorageAlert) {
        if (pct >= 100) {
          await this.notificationService.createNotification(userId, {
            notificationType: 'STORAGE_WARNING',
            title: 'Storage Space Full',
            message: 'Your storage capacity has reached 100%. Free up space or upgrade your plan to continue uploading files.',
            severity: 'CRITICAL',
          });
        } else if (pct >= 90) {
          await this.notificationService.createNotification(userId, {
            notificationType: 'STORAGE_WARNING',
            title: 'Storage Limit Exhausted',
            message: `Your storage capacity has reached ${pct.toFixed(1)}%. Consider upgrading your plan immediately.`,
            severity: 'CRITICAL',
          });
        } else if (pct >= 80) {
          await this.notificationService.createNotification(userId, {
            notificationType: 'STORAGE_WARNING',
            title: 'Storage Running Low',
            message: `Your storage capacity is at ${pct.toFixed(1)}%. Consider archiving files to free up space.`,
            severity: 'WARNING',
          });
        }
      }
    } catch (error) {
      // Graceful error isolation in background event listeners
    }
  }

  public initialize(): void {
    // --- Auth & User Events ---
    eventBus.on('user.profile_updated', async (data) => {
      await this.notificationService.createNotification(data.userId, {
        notificationType: 'PROFILE_UPDATED',
        title: 'Profile Details Updated',
        message: 'Your account profile settings have been successfully updated.',
        severity: 'INFO',
      });
    });

    eventBus.on('user.password_changed', async (data) => {
      await this.notificationService.createNotification(data.userId, {
        notificationType: 'PASSWORD_CHANGED',
        title: 'Security Alert: Password Changed',
        message: 'Your account password was updated successfully. If you did not request this, secure your account.',
        severity: 'CRITICAL',
      });
    });

    // --- File Events ---
    eventBus.on('file.created', async (data) => {
      // 1. File Upload Notification
      await this.notificationService.createNotification(data.userId, {
        notificationType: 'FILE_UPLOADED',
        title: 'File Uploaded',
        message: `File "${data.fileName}" has been uploaded successfully.`,
        severity: 'SUCCESS',
        metadata: { fileId: data.fileId },
      });

      // 2. Security rating warnings triggers
      if (data.securityScore < 50) {
        await this.notificationService.createNotification(data.userId, {
          notificationType: 'SECURITY_ALERT',
          title: 'Critical Security Risk Detected',
          message: `File "${data.fileName}" contains critical security risks (score: ${data.securityScore}). Review immediately.`,
          severity: 'CRITICAL',
          metadata: { fileId: data.fileId },
        });
      } else if (data.securityScore < 70) {
        await this.notificationService.createNotification(data.userId, {
          notificationType: 'SECURITY_ALERT',
          title: 'Low Security Rating Warning',
          message: `File "${data.fileName}" was flagged with a low security rating of ${data.securityScore}.`,
          severity: 'WARNING',
          metadata: { fileId: data.fileId },
        });
      }

      // 3. STORAGE EVALUATION
      await this.evaluateStorageAlerts(data.userId);
    });

    eventBus.on('file.deleted', async (data) => {
      // Storage update checks (reclaiming space alerts evaluation)
      await this.evaluateStorageAlerts(data.userId);
    });

    // --- Share Events ---
    shareEventEmitter.on('shareCreated', async (data) => {
      // 1. Share created notification
      await this.notificationService.createNotification(data.ownerId, {
        notificationType: 'FILE_SHARED',
        title: 'Sharing Link Generated',
        message: 'A secure sharing link has been created for your file.',
        severity: 'INFO',
        metadata: { shareId: data.shareId, fileId: data.fileId },
      });

      // 2. Unsecured Share Warning checks
      try {
        const share = await this.shareRepository.findById(data.shareId);
        if (share && !share.passwordProtected && !share.expiryDate) {
          await this.notificationService.createNotification(data.ownerId, {
            notificationType: 'SECURITY_ALERT',
            title: 'Unsecured Share Warning',
            message: 'You generated a sharing link without password protection or expiration. Secure this link.',
            severity: 'WARNING',
            metadata: { shareId: data.shareId, fileId: data.fileId },
          });
        }
      } catch (error) {
        // Isolation
      }
    });

    shareEventEmitter.on('shareRevoked', async (data) => {
      await this.notificationService.createNotification(data.ownerId, {
        notificationType: 'SHARE_REVOKED',
        title: 'Sharing Link Revoked',
        message: 'A sharing access link has been manually revoked.',
        severity: 'WARNING',
        metadata: { shareId: data.shareId, fileId: data.fileId },
      });
    });

    shareEventEmitter.on('shareDownloaded', async (data) => {
      // Resolve file owner to notify
      try {
        const share = await this.shareRepository.findById(data.shareId);
        if (share) {
          await this.notificationService.createNotification(share.ownerId, {
            notificationType: 'FILE_DOWNLOADED',
            title: 'File Downloaded',
            message: 'Your shared file has been downloaded by a recipient.',
            severity: 'INFO',
            metadata: { shareId: data.shareId, fileId: share.fileId },
          });
        }
      } catch (error) {
        // Isolation
      }
    });

    shareEventEmitter.on('shareUpdated', async (data) => {
      try {
        const share = await this.shareRepository.findById(data.shareId);
        if (share) {
          if (share.shareStatus === 'EXPIRED') {
            await this.notificationService.createNotification(share.ownerId, {
              notificationType: 'SHARE_EXPIRED',
              title: 'Sharing Link Expired',
              message: 'Your secure sharing link has expired.',
              severity: 'WARNING',
              metadata: { shareId: data.shareId, fileId: share.fileId },
            });
          }
        }
      } catch (error) {
        // Isolation
      }
    });
  }
}
