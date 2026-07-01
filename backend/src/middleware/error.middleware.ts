import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/app-error';
import { logger } from '../config/logger';
import { env } from '../config/env';

export const errorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let errors: any[] = [];

  const requestId = req.headers['x-request-id'] || 'system';

  if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Validation Failed';
    errors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    logger.warn(`Validation error [ReqID: ${requestId}]: ${message}`, { errors });
  } else if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors;

    if (err.isOperational) {
      logger.warn(`Operational error [ReqID: ${requestId}]: ${message} (Status: ${statusCode})`, { errors });
    } else {
      logger.error(`Critical error [ReqID: ${requestId}]: ${message}`, {
        stack: err.stack,
        errors,
      });
    }
  } else {
    logger.error(`Unhandled exception [ReqID: ${requestId}]: ${err.message}`, {
      stack: err.stack,
    });

    if (env.NODE_ENV === 'production') {
      message = 'An unexpected error occurred. Please try again later.';
    } else {
      message = err.message;
      errors = [{ stack: err.stack }];
    }
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};
