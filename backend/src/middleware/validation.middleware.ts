import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodEffects, ZodError } from 'zod';

export interface ValidationSchemas {
  body?: AnyZodObject | ZodEffects<AnyZodObject>;
  query?: AnyZodObject | ZodEffects<AnyZodObject>;
  params?: AnyZodObject | ZodEffects<AnyZodObject>;
}

export const validate = (schemas: ValidationSchemas) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const issues: ZodError['issues'] = [];

    if (schemas.params) {
      const result = await schemas.params.safeParseAsync(req.params);
      if (!result.success) {
        issues.push(
          ...result.error.issues.map((issue) => ({
            ...issue,
            path: ['params', ...issue.path],
          }))
        );
      } else {
        req.params = result.data;
      }
    }

    if (schemas.query) {
      const result = await schemas.query.safeParseAsync(req.query);
      if (!result.success) {
        issues.push(
          ...result.error.issues.map((issue) => ({
            ...issue,
            path: ['query', ...issue.path],
          }))
        );
      } else {
        req.query = result.data;
      }
    }

    if (schemas.body) {
      const result = await schemas.body.safeParseAsync(req.body);
      if (!result.success) {
        issues.push(
          ...result.error.issues.map((issue) => ({
            ...issue,
            path: ['body', ...issue.path],
          }))
        );
      } else {
        req.body = result.data;
      }
    }

    if (issues.length > 0) {
      next(new ZodError(issues));
      return;
    }

    next();
  };
};

