import { Request, Response, NextFunction } from 'express';
import { TokenService } from '../modules/auth/services/token.service';
import { RepositoryRegistry } from '../modules/database/repositories/registry';
import { UnauthorizedError, ForbiddenError } from '../utils/app-error';
import { UserRole } from '../modules/auth/interfaces/user.interface';

/**
 * Guard middleware verifying JWT authorization headers, extracting token,
 * checking user status, and exposing the parsed User object on req.user.
 */
export const protect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let token: string | undefined;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new UnauthorizedError('You are not logged in. Please log in to get access.');
    }

    let decoded: any;
    try {
      decoded = await TokenService.verifyAccessToken(token);
    } catch (err) {
      throw new UnauthorizedError('Invalid or expired authentication token');
    }

    const userRepository = RepositoryRegistry.getUserRepository();
    let currentUser = await userRepository.findById(decoded.sub);
    if (!currentUser && decoded.email) {
      currentUser = await userRepository.findByEmail(decoded.email);
    }

    if (!currentUser) {
      throw new UnauthorizedError('The user belonging to this token no longer exists.');
    }

    if (currentUser.accountStatus === 'SUSPENDED') {
      throw new ForbiddenError('Your account has been suspended.');
    }

    req.user = currentUser;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Filter middleware validating user roles (e.g., USER, ADMIN, OWNER).
 */
export const restrictTo = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError('Authentication required'));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(new ForbiddenError('You do not have permission to perform this action'));
      return;
    }

    next();
  };
};
