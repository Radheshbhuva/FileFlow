import { EventEmitter } from 'events';
import { RealtimeEvent, RealtimeEventType } from '../types/realtime.types';
import { WebSocketProvider } from '../providers/websocket.provider';
import { SSEProvider } from '../providers/sse.provider';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../../config/logger';
import { Server as HttpServer } from 'http';

export class EventBusService {
  private static instance: EventBusService;
  private localEmitter: EventEmitter = new EventEmitter();
  private wsProvider?: WebSocketProvider;
  private sseProvider: SSEProvider;

  private constructor() {
    this.sseProvider = new SSEProvider();
  }

  public static getInstance(): EventBusService {
    if (!EventBusService.instance) {
      EventBusService.instance = new EventBusService();
    }
    return EventBusService.instance;
  }

  /**
   * Initializes WebSocket and SSE transports
   */
  public async initialize(server?: HttpServer): Promise<void> {
    this.wsProvider = new WebSocketProvider(server);
    await this.wsProvider.connect();
    await this.sseProvider.connect();
    logger.info('⚡ Event Bus Service initialized with WS and SSE transports');
  }

  public async shutdown(): Promise<void> {
    if (this.wsProvider) {
      await this.wsProvider.disconnect();
    }
    await this.sseProvider.disconnect();
    this.localEmitter.removeAllListeners();
    logger.info('⚡ Event Bus Service shut down');
  }

  public getWebSocketProvider(): WebSocketProvider {
    if (!this.wsProvider) {
      throw new Error('WebSocketProvider has not been initialized. Call initialize() first.');
    }
    return this.wsProvider;
  }

  public getSSEProvider(): SSEProvider {
    return this.sseProvider;
  }

  /**
   * Publish a system-wide real-time event
   */
  public async publishEvent(
    eventData: Omit<RealtimeEvent, 'id' | 'timestamp'> & Partial<Pick<RealtimeEvent, 'id' | 'timestamp'>>
  ): Promise<RealtimeEvent> {
    const event: RealtimeEvent = {
      id: eventData.id || uuidv4(),
      timestamp: eventData.timestamp || new Date(),
      eventType: eventData.eventType,
      workspaceId: eventData.workspaceId,
      userId: eventData.userId,
      payload: eventData.payload || {},
    };

    logger.debug(`Publishing realtime event: type=${event.eventType}, workspace=${event.workspaceId}, user=${event.userId}`);

    // 1. Emit to local subscriber handlers
    this.localEmitter.emit(event.eventType, event);
    this.localEmitter.emit('*', event);

    // 2. Broadcast to transports based on target channels
    if (event.workspaceId) {
      await this.broadcastToWorkspace(event.workspaceId, event);
    }
    if (event.userId) {
      await this.broadcastToUser(event.userId, event);
    }

    // 3. Automated Dashboard real-time update triggers
    const triggerDashboardUpdates = [
      'FILE_UPLOADED',
      'FILE_SHARED',
      'NOTIFICATION_CREATED',
      'ACTIVITY_CREATED',
    ];

    if (triggerDashboardUpdates.includes(event.eventType)) {
      // Async trigger of dashboard update event to avoid blocking core thread
      this.publishEvent({
        eventType: 'DASHBOARD_UPDATED',
        workspaceId: event.workspaceId,
        userId: event.userId,
        payload: {
          triggerEventType: event.eventType,
          triggerEventId: event.id,
        },
      }).catch((err) => logger.error('Failed to publish automated DASHBOARD_UPDATED event:', err));
    }

    return event;
  }

  /**
   * Subscribe local callback listeners to specific event types
   */
  public subscribe(eventType: string, handler: (event: RealtimeEvent) => void): void {
    this.localEmitter.on(eventType, handler);
  }

  /**
   * Unsubscribe local callback listeners from specific event types
   */
  public unsubscribe(eventType: string, handler: (event: RealtimeEvent) => void): void {
    this.localEmitter.off(eventType, handler);
  }

  /**
   * Broadcast real-time message to workspace channel
   */
  public async broadcastToWorkspace(workspaceId: string, event: RealtimeEvent): Promise<void> {
    const channel = `workspace:${workspaceId}`;
    if (this.wsProvider) {
      await this.wsProvider.publish(channel, event);
    }
    await this.sseProvider.publish(channel, event);
  }

  /**
   * Broadcast real-time message to direct user channel
   */
  public async broadcastToUser(userId: string, event: RealtimeEvent): Promise<void> {
    const channel = `user:${userId}`;
    if (this.wsProvider) {
      await this.wsProvider.publish(channel, event);
    }
    await this.sseProvider.publish(channel, event);
  }
}

// Export singleton instance convenience
export const eventBusService = EventBusService.getInstance();
