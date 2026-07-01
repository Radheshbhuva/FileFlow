import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { env } from '../../../config/env';
import { eventBus } from '../../../shared/event-bus';

export class AuthController {
  private authService: AuthService;

  constructor(authService: AuthService = new AuthService()) {
    this.authService = authService;
  }

  public register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.authService.register(req.body);
      res.status(201).json({
        success: true,
        message: 'Registration successful. Please verify your email.',
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  };

  public login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { accessToken, user } = await this.authService.login(req.body);
      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: { token: accessToken, user },
      });
    } catch (error) {
      next(error);
    }
  };

  public verifyEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = req.query.token as string;
      const user = await this.authService.verifyEmail(token);
      res.status(200).json({
        success: true,
        message: 'Email verified successfully.',
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  };

  public forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { resetToken } = await this.authService.forgotPassword(req.body.email);
      res.status(200).json({
        success: true,
        message: 'If an account matches this email, a reset code will be sent.',
        // Only return reset token locally in development and test environments
        ...(env.NODE_ENV !== 'production' ? { data: { resetToken } } : {}),
      });
    } catch (error) {
      next(error);
    }
  };

  public resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.authService.resetPassword(req.body);
      res.status(200).json({
        success: true,
        message: 'Password reset successful.',
      });
    } catch (error) {
      next(error);
    }
  };

  public logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (userId) {
        eventBus.emit('user.logged_out', { userId });
      }
      res.status(200).json({
        success: true,
        message: 'Logout successful. Please discard your access token.',
      });
    } catch (error) {
      next(error);
    }
  };

  public getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user;
      if (user) {
        const { passwordHash: _, ...userWithoutPassword } = user;
        res.status(200).json({
          success: true,
          message: 'User profile retrieved successfully',
          data: { user: userWithoutPassword },
        });
        return;
      }
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    } catch (error) {
      next(error);
    }
  };
}
