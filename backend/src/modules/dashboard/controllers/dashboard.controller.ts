import { Request, Response, NextFunction } from 'express';
import { DashboardService } from '../services/dashboard.service';
import { UnauthorizedError } from '../../../utils/app-error';

export class DashboardController {
  private dashboardService: DashboardService;

  constructor(dashboardService: DashboardService = new DashboardService()) {
    this.dashboardService = dashboardService;
  }

  public getWorkspaceOverview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const overview = await this.dashboardService.getWorkspaceOverview(userId);
      res.status(200).json({
        success: true,
        message: 'Workspace overview loaded successfully',
        data: { overview },
      });
    } catch (error) {
      next(error);
    }
  };

  public getStorageIntelligence = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const storage = await this.dashboardService.getStorageIntelligence(userId);
      res.status(200).json({
        success: true,
        message: 'Storage intelligence data loaded successfully',
        data: { storage },
      });
    } catch (error) {
      next(error);
    }
  };

  public getSecurityIntelligence = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const security = await this.dashboardService.getSecurityIntelligence(userId);
      res.status(200).json({
        success: true,
        message: 'Security intelligence metrics resolved successfully',
        data: { security },
      });
    } catch (error) {
      next(error);
    }
  };

  public getProductivityInsights = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const productivity = await this.dashboardService.getProductivityInsights(userId);
      res.status(200).json({
        success: true,
        message: 'Productivity metrics gathered successfully',
        data: { productivity },
      });
    } catch (error) {
      next(error);
    }
  };

  public getRecentActivity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const activities = await this.dashboardService.getRecentActivity(userId);
      res.status(200).json({
        success: true,
        message: 'Recent activity intelligence compiled successfully',
        data: { activities },
      });
    } catch (error) {
      next(error);
    }
  };

  public getNotifications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const notifications = await this.dashboardService.getNotifications(userId);
      res.status(200).json({
        success: true,
        message: 'Workspace alerts and notices loaded successfully',
        data: { notifications },
      });
    } catch (error) {
      next(error);
    }
  };

  public getDashboardInsights = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const insights = await this.dashboardService.getDashboardInsights(userId);
      const healthScore = await this.dashboardService.getWorkspaceHealthScore(userId);

      res.status(200).json({
        success: true,
        message: 'Dashboard strategic insights resolved successfully',
        data: { insights, healthScore },
      });
    } catch (error) {
      next(error);
    }
  };
}
