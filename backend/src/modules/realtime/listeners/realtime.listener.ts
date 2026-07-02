import { eventBus } from '../../../shared/event-bus';
import { uploadEventEmitter } from '../../uploads/services/upload.service';
import { shareEventEmitter } from '../../shares/services/share.service';
import { eventBusService } from '../services/event-bus.service';
import { RepositoryRegistry } from '../../database/repositories/registry';
import { logger } from '../../../config/logger';

export class RealtimeListener {
  private static instance: RealtimeListener;

  private constructor() {}

  public static getInstance(): RealtimeListener {
    if (!RealtimeListener.instance) {
      RealtimeListener.instance = new RealtimeListener();
    }
    return RealtimeListener.instance;
  }

  public initialize(): void {
    logger.info('🔔 Initializing Realtime Domain Event Listener Bridge...');

    // 1. Upload Event Emitter Listeners
    uploadEventEmitter.on('uploadCompleted', async (data: { userId: string; uploadId: string; fileId: string }) => {
      try {
        const workspaceId = await this.resolveWorkspaceId(data.userId);
        await eventBusService.publishEvent({
          eventType: 'FILE_UPLOADED',
          workspaceId,
          userId: data.userId,
          payload: { fileId: data.fileId, uploadId: data.uploadId },
        });
      } catch (err: any) {
        logger.error('Error handling uploadCompleted real-time bridge:', err);
      }
    });

    // 2. Share Event Emitter Listeners
    shareEventEmitter.on('shareCreated', async (data: { ownerId: string; shareId: string; fileId: string }) => {
      try {
        const workspaceId = await this.resolveWorkspaceId(data.ownerId);
        await eventBusService.publishEvent({
          eventType: 'FILE_SHARED',
          workspaceId,
          userId: data.ownerId,
          payload: { shareId: data.shareId, fileId: data.fileId },
        });
      } catch (err: any) {
        logger.error('Error handling shareCreated real-time bridge:', err);
      }
    });

    shareEventEmitter.on('shareRevoked', async (data: { ownerId: string; shareId: string; fileId: string }) => {
      try {
        const workspaceId = await this.resolveWorkspaceId(data.ownerId);
        await eventBusService.publishEvent({
          eventType: 'SHARE_REVOKED',
          workspaceId,
          userId: data.ownerId,
          payload: { shareId: data.shareId, fileId: data.fileId },
        });
      } catch (err: any) {
        logger.error('Error handling shareRevoked real-time bridge:', err);
      }
    });

    shareEventEmitter.on('shareDownloaded', async (data: { ownerId: string; shareId: string; fileId: string }) => {
      try {
        const workspaceId = await this.resolveWorkspaceId(data.ownerId);
        await eventBusService.publishEvent({
          eventType: 'FILE_DOWNLOADED',
          workspaceId,
          userId: data.ownerId,
          payload: { shareId: data.shareId, fileId: data.fileId },
        });
      } catch (err: any) {
        logger.error('Error handling shareDownloaded real-time bridge:', err);
      }
    });

    // 3. Shared Global eventBus Listeners
    eventBus.on('file.created', async (data: { userId: string; fileId: string; fileName: string }) => {
      try {
        const workspaceId = await this.resolveWorkspaceId(data.userId);
        await eventBusService.publishEvent({
          eventType: 'FILE_UPLOADED',
          workspaceId,
          userId: data.userId,
          payload: { fileId: data.fileId, fileName: data.fileName },
        });
      } catch (err: any) {
        logger.error('Error handling file.created real-time bridge:', err);
      }
    });

    eventBus.on('file.updated', async (data: { userId: string; fileId: string; fileName: string; updates?: any }) => {
      try {
        const workspaceId = await this.resolveWorkspaceId(data.userId);
        await eventBusService.publishEvent({
          eventType: 'FILE_UPDATED',
          workspaceId,
          userId: data.userId,
          payload: { fileId: data.fileId, fileName: data.fileName, updates: data.updates },
        });
      } catch (err: any) {
        logger.error('Error handling file.updated real-time bridge:', err);
      }
    });

    eventBus.on('file.deleted', async (data: { userId: string; fileId: string; fileName: string }) => {
      try {
        const workspaceId = await this.resolveWorkspaceId(data.userId);
        await eventBusService.publishEvent({
          eventType: 'FILE_DELETED',
          workspaceId,
          userId: data.userId,
          payload: { fileId: data.fileId, fileName: data.fileName },
        });
      } catch (err: any) {
        logger.error('Error handling file.deleted real-time bridge:', err);
      }
    });

    eventBus.on('file.favorited', async (data: { userId: string; fileId: string; fileName: string }) => {
      try {
        const workspaceId = await this.resolveWorkspaceId(data.userId);
        await eventBusService.publishEvent({
          eventType: 'FILE_UPDATED',
          workspaceId,
          userId: data.userId,
          payload: { fileId: data.fileId, fileName: data.fileName, favorite: true },
        });
      } catch (err: any) {
        logger.error('Error handling file.favorited real-time bridge:', err);
      }
    });

    eventBus.on('file.unfavorited', async (data: { userId: string; fileId: string; fileName: string }) => {
      try {
        const workspaceId = await this.resolveWorkspaceId(data.userId);
        await eventBusService.publishEvent({
          eventType: 'FILE_UPDATED',
          workspaceId,
          userId: data.userId,
          payload: { fileId: data.fileId, fileName: data.fileName, favorite: false },
        });
      } catch (err: any) {
        logger.error('Error handling file.unfavorited real-time bridge:', err);
      }
    });

    eventBus.on('user.profile_updated', async (data: { userId: string }) => {
      try {
        const workspaceId = await this.resolveWorkspaceId(data.userId);
        await eventBusService.publishEvent({
          eventType: 'WORKSPACE_UPDATED',
          workspaceId,
          userId: data.userId,
          payload: { userId: data.userId },
        });
      } catch (err: any) {
        logger.error('Error handling user.profile_updated real-time bridge:', err);
      }
    });
  }

  private async resolveWorkspaceId(userId: string): Promise<string> {
    try {
      const workspaceRepo = RepositoryRegistry.getWorkspaceRepository();
      const workspaces = await workspaceRepo.findByOwnerId(userId);
      return workspaces.length > 0 ? workspaces[0].id : userId;
    } catch {
      return userId;
    }
  }
}
export const realtimeListener = RealtimeListener.getInstance();
