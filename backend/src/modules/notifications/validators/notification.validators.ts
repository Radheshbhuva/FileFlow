import { z } from 'zod';

export const listNotificationsQuerySchema = {
  query: z.object({
    status: z.enum(['UNREAD', 'READ', 'ARCHIVED']).optional(),
    severity: z.enum(['INFO', 'SUCCESS', 'WARNING', 'CRITICAL']).optional(),
  }),
};

export const notificationIdParamsSchema = {
  params: z.object({
    id: z.string().uuid('Invalid notification identifier format'),
  }),
};
