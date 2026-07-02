import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { RealtimeProvider } from '../interfaces/realtime-provider.interface';
import { TokenService } from '../../auth/services/token.service';
import { RepositoryRegistry } from '../../database/repositories/registry';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../../config/logger';

interface ActiveClient {
  id: string;
  socket: WebSocket;
  userId: string;
  workspaceId: string;
  subscriptions: Set<string>;
}

export class WebSocketProvider implements RealtimeProvider {
  private wss?: WebSocketServer;
  private httpServer?: HttpServer;
  private port?: number;
  private clients: Map<string, ActiveClient> = new Map();
  private internalSubscriptions: Map<string, Set<(message: any) => void>> = new Map();

  constructor(serverOrPort?: HttpServer | number) {
    if (typeof serverOrPort === 'number') {
      this.port = serverOrPort;
    } else if (serverOrPort) {
      this.httpServer = serverOrPort;
    }
  }

  public async connect(): Promise<void> {
    if (this.httpServer) {
      this.wss = new WebSocketServer({ server: this.httpServer });
      logger.info('🔌 WebSocket Server attached to primary HTTP server');
    } else if (this.port) {
      this.wss = new WebSocketServer({ port: this.port });
      logger.info(`🔌 WebSocket Server running standalone on port ${this.port}`);
    } else {
      this.wss = new WebSocketServer({ noServer: true });
      logger.info('🔌 WebSocket Server initialized in noServer mode');
    }

    this.wss.on('connection', this.handleConnection);
  }

  public async disconnect(): Promise<void> {
    // Close all connections
    for (const [id, client] of this.clients.entries()) {
      client.socket.terminate();
    }
    this.clients.clear();

    if (this.wss) {
      await new Promise<void>((resolve) => {
        this.wss!.close(() => resolve());
      });
      logger.info('🔌 WebSocket Server shut down successfully');
    }
  }

  public async publish(channel: string, message: any): Promise<void> {
    const serializedMessage = JSON.stringify({ channel, data: message });

    for (const [clientId, client] of this.clients.entries()) {
      if (client.subscriptions.has(channel)) {
        if (client.socket.readyState === WebSocket.OPEN) {
          client.socket.send(serializedMessage);
        }
      }
    }

    // Call any internal subscribers
    const handlers = this.internalSubscriptions.get(channel);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(message);
        } catch (err: any) {
          logger.error('Error in internal subscription handler:', err);
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

  private handleConnection = async (socket: WebSocket, req: any): Promise<void> => {
    const connectionId = uuidv4();
    logger.debug(`WebSocket connection attempt initiated: ${connectionId}`);

    try {
      // Parse token from URL query string
      const url = new URL(req.url || '', 'http://localhost');
      const token = url.searchParams.get('token');

      if (!token) {
        logger.warn('WebSocket handshake rejected: Token query parameter is missing');
        socket.close(4001, 'Unauthorized: Token missing');
        return;
      }

      // Decode and verify JWT
      const decoded = await TokenService.verifyAccessToken(token);
      const userId = decoded.sub;

      if (!userId) {
        logger.warn('WebSocket handshake rejected: Token did not resolve to user sub');
        socket.close(4001, 'Unauthorized: Invalid token');
        return;
      }

      // Retrieve authorized workspaces and bind default workspaceId
      const workspaceRepo = RepositoryRegistry.getWorkspaceRepository();
      const workspaces = await workspaceRepo.findByOwnerId(userId);
      const workspaceId = workspaces.length > 0 ? workspaces[0].id : userId; // Default workspace fallback

      const client: ActiveClient = {
        id: connectionId,
        socket,
        userId,
        workspaceId,
        subscriptions: new Set(),
      };

      // Auto-subscribe the client to their personal channel and workspace channel
      client.subscriptions.add(`user:${userId}`);
      client.subscriptions.add(`workspace:${workspaceId}`);

      this.clients.set(connectionId, client);
      logger.info(`WebSocket Client connected successfully: user=${userId}, workspace=${workspaceId}`);

      socket.on('message', async (data: string) => {
        try {
          const payload = JSON.parse(data);
          const { action, channel } = payload;

          if (action === 'subscribe') {
            await this.handleClientSubscribe(client, channel);
          } else if (action === 'unsubscribe') {
            client.subscriptions.delete(channel);
            socket.send(JSON.stringify({ success: true, message: `Unsubscribed from ${channel}` }));
          } else if (action === 'ping') {
            socket.send(JSON.stringify({ type: 'pong' }));
          }
        } catch (error: any) {
          logger.error(`WebSocket incoming message error (client=${connectionId}):`, error);
          socket.send(JSON.stringify({ success: false, error: 'Malformed message frame or action' }));
        }
      });

      socket.on('close', () => {
        this.clients.delete(connectionId);
        logger.debug(`WebSocket client disconnected: ${connectionId}`);
      });

      socket.on('error', (err) => {
        logger.error(`WebSocket connection error (client=${connectionId}):`, err);
      });

      // Send successful connection confirmation back
      socket.send(JSON.stringify({
        success: true,
        message: 'Connected to FileFlow WebSocket real-time events layer',
        data: { userId, workspaceId },
      }));

    } catch (err: any) {
      logger.error('WebSocket connection error during handshake:', err);
      socket.close(4002, 'Handshake authentication failed');
    }
  };

  private async handleClientSubscribe(client: ActiveClient, channel: string): Promise<void> {
    if (!channel) {
      client.socket.send(JSON.stringify({ success: false, error: 'Channel name is required' }));
      return;
    }

    const [channelType, targetId] = channel.split(':');

    // 1. Authorization check for User channel
    if (channelType === 'user') {
      if (targetId !== client.userId) {
        client.socket.send(JSON.stringify({ success: false, error: 'Unauthorized subscription to user channel' }));
        return;
      }
    }

    // 2. Authorization check for Workspace channel
    if (channelType === 'workspace') {
      const workspaceRepo = RepositoryRegistry.getWorkspaceRepository();
      const workspace = await workspaceRepo.findById(targetId);

      if (!workspace || workspace.ownerId !== client.userId) {
        client.socket.send(JSON.stringify({ success: false, error: 'Unauthorized subscription to workspace channel' }));
        return;
      }
    }

    client.subscriptions.add(channel);
    client.socket.send(JSON.stringify({ success: true, message: `Subscribed successfully to ${channel}` }));
  }

  // Helper method for testing/inspecting state
  public getClientsCount(): number {
    return this.clients.size;
  }

  public getClientSubscriptions(clientId: string): Set<string> | undefined {
    return this.clients.get(clientId)?.subscriptions;
  }
}
