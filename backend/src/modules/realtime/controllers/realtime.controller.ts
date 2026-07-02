import { Request, Response, NextFunction } from 'express';
import { TokenService } from '../../auth/services/token.service';
import { RepositoryRegistry } from '../../database/repositories/registry';
import { eventBusService } from '../services/event-bus.service';
import { UnauthorizedError } from '../../../utils/app-error';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../../config/logger';

export class RealtimeController {
  public establishStream = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = (req.query.token as string) || req.headers.authorization?.split(' ')[1];

      if (!token) {
        throw new UnauthorizedError('Unauthorized: Access token is missing');
      }

      // Decode and verify token
      const decoded = await TokenService.verifyAccessToken(token);
      const userId = decoded.sub;

      if (!userId) {
        throw new UnauthorizedError('Unauthorized: Invalid token');
      }

      // Retrieve workspaces
      const workspaceRepo = RepositoryRegistry.getWorkspaceRepository();
      const workspaces = await workspaceRepo.findByOwnerId(userId);
      const workspaceId = workspaces.length > 0 ? workspaces[0].id : userId;

      // Keep socket connection alive
      req.socket.setKeepAlive(true);
      req.socket.setTimeout(0);

      // Establish SSE stream headers
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      });

      const connectionId = uuidv4();
      const sseProvider = eventBusService.getSSEProvider();
      sseProvider.registerClient(connectionId, res, userId, workspaceId);

      req.on('close', () => {
        sseProvider.removeClient(connectionId);
      });
    } catch (error) {
      logger.error('Failed to establish SSE connection:', error);
      next(error);
    }
  };
}
