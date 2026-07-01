import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from '../services/analytics.service';
import { UnauthorizedError } from '../../../utils/app-error';

export class AnalyticsController {
  private analyticsService: AnalyticsService;

  constructor(analyticsService: AnalyticsService = new AnalyticsService()) {
    this.analyticsService = analyticsService;
  }

  public getOverview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const overview = await this.analyticsService.getOverview(userId);
      res.status(200).json({
        success: true,
        message: 'Workspace overview analytics retrieved successfully',
        data: overview,
      });
    } catch (error) {
      next(error);
    }
  };

  public getStorageAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const storage = await this.analyticsService.getStorageAnalytics(userId);
      res.status(200).json({
        success: true,
        message: 'Storage analytics retrieved successfully',
        data: storage,
      });
    } catch (error) {
      next(error);
    }
  };

  public getSharingAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const sharing = await this.analyticsService.getSharingAnalytics(userId);
      res.status(200).json({
        success: true,
        message: 'Sharing analytics retrieved successfully',
        data: sharing,
      });
    } catch (error) {
      next(error);
    }
  };

  public getProductivityAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const productivity = await this.analyticsService.getProductivityAnalytics(userId);
      res.status(200).json({
        success: true,
        message: 'Productivity analytics retrieved successfully',
        data: productivity,
      });
    } catch (error) {
      next(error);
    }
  };

  public getSecurityAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const security = await this.analyticsService.getSecurityAnalytics(userId);
      res.status(200).json({
        success: true,
        message: 'Security analytics retrieved successfully',
        data: security,
      });
    } catch (error) {
      next(error);
    }
  };

  public getActivityAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const activity = await this.analyticsService.getActivityAnalytics(userId);
      res.status(200).json({
        success: true,
        message: 'Activity analytics retrieved successfully',
        data: activity,
      });
    } catch (error) {
      next(error);
    }
  };

  public getSearchAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const search = await this.analyticsService.getSearchAnalytics(userId);
      res.status(200).json({
        success: true,
        message: 'Search analytics retrieved successfully',
        data: search,
      });
    } catch (error) {
      next(error);
    }
  };

  public getReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const { type, startDate, endDate } = req.query as any;

      const report = await this.analyticsService.generateReport(userId, type, {
        startDate,
        endDate,
      });

      res.status(200).json({
        success: true,
        message: 'Executive analytics report generated successfully',
        data: report,
      });
    } catch (error) {
      next(error);
    }
  };
}
