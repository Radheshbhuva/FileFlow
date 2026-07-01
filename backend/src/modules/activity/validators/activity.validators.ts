import { z } from 'zod';

const activityTypes = [
  'LOGIN',
  'LOGOUT',
  'REGISTER',
  'PROFILE_UPDATED',
  'PASSWORD_CHANGED',
  'FILE_UPLOADED',
  'FILE_UPDATED',
  'FILE_DELETED',
  'FILE_ARCHIVED',
  'FILE_FAVORITED',
  'FILE_UNFAVORITED',
  'FILE_SHARED',
  'FILE_UNSHARED',
  'SHARE_CREATED',
  'SHARE_REVOKED',
  'SHARE_DOWNLOADED',
  'UPLOAD_STARTED',
  'UPLOAD_COMPLETED',
  'UPLOAD_FAILED',
] as const;

export const listActivitiesSchema = {
  query: z.object({
    page: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 1))
      .pipe(z.number().int().positive()),
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 10))
      .pipe(z.number().int().min(1).max(100)),
    activityType: z.enum(activityTypes).optional(),
    severity: z.enum(['INFO', 'WARNING', 'CRITICAL']).optional(),
    resourceType: z.string().optional(),
    startDate: z.string().datetime({ message: 'startDate must be a valid ISO datetime' }).optional(),
    endDate: z.string().datetime({ message: 'endDate must be a valid ISO datetime' }).optional(),
    search: z.string().optional(),
  }),
};
