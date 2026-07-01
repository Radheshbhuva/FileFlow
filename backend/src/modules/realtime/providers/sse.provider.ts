import { Response } from 'express';
import { RealtimeProvider } from '../interfaces/realtime-provider.interface';
import { logger } from '../../../config/logger';

interface ActiveSSEClient {
  connectionId: string;
  res: Response;
  userId: string;
  workspaceId: string;
  subscriptions: Set<string>;
}

export class SSEProvider implements RealtimeProvider {
  private clients: Map<string, ActiveSSEClient> = new Map();
  private internalSubscriptions: Map<string, Set<(message: any) => void>> = new Map();
  private heartbeatInterval?: NodeJS.Timeout;

  public async connect(): Promise<void> {
    logger.info('🔌 SSE Transport Layer active');
    // Start standard heartbeat interval (e.g. every 30 seconds) to prevent load balancers/proxies from timing out connections
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, 30000);
  }

  public async disconnect(): Promise<void> {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    for (const [connectionId, client] of this.clients.entries()) {
      try {
        client.res.end();
      } catch (err) {
        // ignore
      }
    }
    this.clients.clear();
    logger.info('🔌 SSE Transport Layer shut down successfully');
  }

  public async publish(channel: string, message: any): Promise<void> {
    const dataFrame = `data: ${JSON.stringify({ channel, data: message })}\n\n`;

    for (const [connectionId, client] of this.clients.entries()) {
      if (client.subscriptions.has(channel)) {
        try {
          client.res.write(dataFrame);
        } catch (error: any) {
          logger.error(`Failed to write to SSE client stream (connectionId=${connectionId}):`, error);
          this.removeClient(connectionId);
        }
      }
    }

    const handlers = this.internalSubscriptions.get(channel);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(message);
        } catch (err: any) {
          logger.error('Error in internal SSE subscriber:', err);
        }
      }
    }
  }

  public async subscribe(channel: string, handler: (message: any) => void): Promise<void> {
    const handlers = this.internalSubscriptions.get(channel) || new Set();
    handlers.add(handler);
    this.internalSubscriptions.set(channel, handlers);
  }

  public async unsubscribe(channel: string, handler: (message: any) => void): Promise<void> {
    const handlers = this.internalSubscriptions.get(channel);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.internalSubscriptions.delete(channel);
      }
    }
  }

  /**
   * Register a new active HTTP connection as an SSE streaming client
   */
  public registerClient(
    connectionId: string,
    res: Response,
    userId: string,
    workspaceId: string
  ): void {
    const subscriptions = new Set<string>([`user:${userId}`, `workspace:${workspaceId}`]);

    const client: ActiveSSEClient = {
      connectionId,
      res,
      userId,
      workspaceId,
      subscriptions,
    };

    this.clients.set(connectionId, client);
    logger.info(`SSE Client registered successfully: user=${userId}, workspace=${workspaceId}, conn=${connectionId}`);

    // Send connection initialization frame
    res.write(`event: open\ndata: ${JSON.stringify({ success: true, message: 'Connected to FileFlow SSE stream', data: { userId, workspaceId } })}\n\n`);
  }

  /**
   * Remove a client connection from active broadcasts
   */
  public removeClient(connectionId: string): void {
    const client = this.clients.get(connectionId);
    if (client) {
      this.clients.delete(connectionId);
      logger.info(`SSE Client connection cleaned up: ${connectionId}`);
    }
  }

  private sendHeartbeat(): void {
    // Send a standard comment block (:keepalive) in SSE to keep the connections warm
    const keepaliveFrame = ':\n\n';
    for (const [connectionId, client] of this.clients.entries()) {
      try {
        client.res.write(keepaliveFrame);
      } catch (err) {
        this.removeClient(connectionId);
      }
    }
  }

  // Helper method for unit testing
  public getClientsCount(): number {
    return this.clients.size;
  }
}
