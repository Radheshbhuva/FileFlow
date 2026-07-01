import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import { UnauthorizedError } from '../../../utils/app-error';

export class UserController {
  private userService: UserService;

  constructor(userService: UserService = new UserService()) {
    this.userService = userService;
  }

  public getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user;
      if (!user) {
        throw new UnauthorizedError('Unauthorized');
      }

      const { passwordHash: _, ...userWithoutPassword } = user;
      res.status(200).json({
        success: true,
        message: 'Profile retrieved successfully',
        data: { user: userWithoutPassword },
      });
    } catch (error) {
      next(error);
    }
  };

  public updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const user = await this.userService.updateProfile(userId, req.body);
      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  };

  public updateAvatar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const user = await this.userService.updateAvatar(userId, req.body.avatar);
      res.status(200).json({
        success: true,
        message: 'Avatar updated successfully',
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  };

  public changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized');
      }

      await this.userService.changePassword(userId, req.body);
      res.status(200).json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  public getStorage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const storage = await this.userService.getStorageAnalytics(userId);
      res.status(200).json({
        success: true,
        message: 'Storage analytics retrieved successfully',
        data: { storage },
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

      const summary = await this.userService.getActivitySummary(userId);
      res.status(200).json({
        success: true,
        message: 'Activity summary retrieved successfully',
        data: { summary },
      });
    } catch (error) {
      next(error);
    }
  };
}
