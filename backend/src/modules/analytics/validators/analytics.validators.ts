import { z } from 'zod';

export const getReportSchema = {
  query: z.object({
    type: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM']).default('WEEKLY').optional(),
    startDate: z.preprocess((val) => (val ? new Date(val as string) : undefined), z.date().optional()),
    endDate: z.preprocess((val) => (val ? new Date(val as string) : undefined), z.date().optional()),
  }).refine((data) => {
    if (data.type === 'CUSTOM') {
      return !!data.startDate && !!data.endDate;
    }
    return true;
  }, {
    message: 'startDate and endDate are required when report type is CUSTOM',
    path: ['startDate'],
  }),
};
