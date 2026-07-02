import { Request, Response, NextFunction } from 'express';
import { NotificationService } from '../services/notification.service';
import { UnauthorizedError } from '../../../utils/app-error';

export class NotificationController {
  private notificationService: NotificationService;

  constructor(notificationService: NotificationService = new NotificationService()) {
    this.notificationService = notificationService;
  }

  public getNotifications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const status = req.query.status as any;
      const notifications = await this.notificationService.getNotifications(userId, status);

      res.status(200).json({
        success: true,
        message: 'Notifications retrieved successfully',
        data: { notifications },
      });
    } catch (error) {
      next(error);
    }
  };

  public getUnreadNotifications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const notifications = await this.notificationService.getUnreadNotifications(userId);

      res.status(200).json({
        success: true,
        message: 'Unread notifications retrieved successfully',
        data: { notifications },
      });
    } catch (error) {
      next(error);
    }
  };

  public getNotification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const notification = await this.notificationService.getNotification(userId, req.params.id);

      res.status(200).json({
        success: true,
        message: 'Notification details loaded successfully',
        data: { notification },
      });
    } catch (error) {
      next(error);
    }
  };

  public markAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const notification = await this.notificationService.markAsRead(userId, req.params.id);

      res.status(200).json({
        success: true,
        message: 'Notification marked as read successfully',
        data: { notification },
      });
    } catch (error) {
      next(error);
    }
  };

  public markAllAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const result = await this.notificationService.markAllAsRead(userId);

      res.status(200).json({
        success: true,
        message: 'All notifications marked as read successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public archiveNotification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const notification = await this.notificationService.archiveNotification(userId, req.params.id);

      res.status(200).json({
        success: true,
        message: 'Notification archived successfully',
        data: { notification },
      });
    } catch (error) {
      next(error);
    }
  };

  public getSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const summary = await this.notificationService.getSummary(userId);

      res.status(200).json({
        success: true,
        message: 'Notification metrics summary resolved successfully',
        data: { summary },
      });
    } catch (error) {
      next(error);
    }
  };
}
