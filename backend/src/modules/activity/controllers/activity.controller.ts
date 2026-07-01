import { Request, Response, NextFunction } from 'express';
import { ActivityService } from '../services/activity.service';
import { UnauthorizedError, ForbiddenError } from '../../../utils/app-error';

export class ActivityController {
  private activityService: ActivityService;

  constructor(activityService: ActivityService = new ActivityService()) {
    this.activityService = activityService;
  }

  public listActivities = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const result = await this.activityService.listActivities(userId, req.query);
      res.status(200).json({
        success: true,
        message: 'Activity feed loaded successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public getActivity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const activity = await this.activityService.getActivity(userId, req.params.id);
      res.status(200).json({
        success: true,
        message: 'Activity record retrieved successfully',
        data: { activity },
      });
    } catch (error) {
      next(error);
    }
  };

  public getRecentActivities = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const activities = await this.activityService.getRecentActivities(userId, limit);
      res.status(200).json({
        success: true,
        message: 'Recent activity feed loaded successfully',
        data: { activities },
      });
    } catch (error) {
      next(error);
    }
  };

  public getActivitySummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const summary = await this.activityService.getActivitySummary(userId);
      res.status(200).json({
        success: true,
        message: 'Activity metrics summary retrieved successfully',
        data: { summary },
      });
    } catch (error) {
      next(error);
    }
  };

  public getUserActivities = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authUserId = req.user?.id;
      if (!authUserId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const targetUserId = req.params.userId;
      // Standard auth barrier check
      if (authUserId !== targetUserId) {
        throw new ForbiddenError('You do not have permission to view this user\'s activity log');
      }

      const result = await this.activityService.listActivities(targetUserId, req.query);
      res.status(200).json({
        success: true,
        message: 'User activity feed loaded successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}
