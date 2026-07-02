import { Request, Response, NextFunction } from 'express';
import { ShareService } from '../services/share.service';
import { UnauthorizedError } from '../../../utils/app-error';

export class ShareController {
  private shareService: ShareService;

  constructor(shareService: ShareService = new ShareService()) {
    this.shareService = shareService;
  }

  public createShare = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const share = await this.shareService.createShare(userId, req.body);
      res.status(201).json({
        success: true,
        message: 'Share link generated successfully',
        data: { share },
      });
    } catch (error) {
      next(error);
    }
  };

  public getShare = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const share = await this.shareService.getShare(userId, req.params.id);
      res.status(200).json({
        success: true,
        message: 'Share configuration retrieved successfully',
        data: { share },
      });
    } catch (error) {
      next(error);
    }
  };

  public listShares = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const {
        search,
        status,
        passwordProtected,
        accessLevel,
        startDate,
        endDate,
        sortBy,
        sortOrder,
        page,
        limit,
      } = req.query;

      const result = await this.shareService.listShares(userId, {
        search: search as string,
        status: status as string,
        passwordProtected: passwordProtected as string,
        accessLevel: accessLevel as string,
        startDate: startDate as string,
        endDate: endDate as string,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });

      res.status(200).json({
        success: true,
        message: 'Active shares listed successfully',
        data: {
          shares: result.shares,
          total: result.total,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  public updateShare = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const share = await this.shareService.updateShare(userId, req.params.id, req.body);
      res.status(200).json({
        success: true,
        message: 'Share link parameters updated successfully',
        data: { share },
      });
    } catch (error) {
      next(error);
    }
  };

  public revokeShare = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const share = await this.shareService.revokeShare(userId, req.params.id);
      res.status(200).json({
        success: true,
        message: 'Share link revoked successfully',
        data: { share },
      });
    } catch (error) {
      next(error);
    }
  };

  public extendShare = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const share = await this.shareService.extendShare(userId, req.params.id, req.body.expiryDate);
      res.status(200).json({
        success: true,
        message: 'Share link expiration extended successfully',
        data: { share },
      });
    } catch (error) {
      next(error);
    }
  };

  public deleteShare = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized');
      }

      await this.shareService.deleteShare(userId, req.params.id);
      res.status(200).json({
        success: true,
        message: 'Share record discarded successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  public getShareAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const analytics = await this.shareService.getAnalytics(userId);
      res.status(200).json({
        success: true,
        message: 'Sharing analytics retrieved successfully',
        data: { analytics },
      });
    } catch (error) {
      next(error);
    }
  };

  public getPublicShare = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.shareService.getPublicShare(req.params.token);
      res.status(200).json({
        success: true,
        message: 'Public share access unlocked successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public verifyPublicSharePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.shareService.verifyPublicSharePassword(req.params.token, req.body.password);
      res.status(200).json({
        success: true,
        message: 'Public share password verified successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public downloadPublicShare = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = req.params.token;
      const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || 'Unknown User-Agent';
      const verificationToken = req.headers['x-share-token'] as string;

      const result = await this.shareService.downloadPublicShare(token, clientIp, userAgent, verificationToken);
      res.status(200).json({
        success: true,
        message: 'File downloaded successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}
