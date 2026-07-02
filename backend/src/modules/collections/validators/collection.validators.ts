import { z } from 'zod';

export const recentlyModifiedQuerySchema = {
  query: z.object({
    days: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : undefined))
      .refine((val) => val === undefined || (Number.isInteger(val) && val > 0), {
        message: 'Days must be a positive integer',
      }),
  }),
};

export const sharedRecentlyQuerySchema = {
  query: z.object({
    days: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : undefined))
      .refine((val) => val === undefined || (Number.isInteger(val) && val > 0), {
        message: 'Days must be a positive integer',
      }),
  }),
};

export const largeFilesQuerySchema = {
  query: z.object({
    thresholdMb: z
      .string()
      .optional()
      .transform((val) => (val ? parseFloat(val) : undefined))
      .refine((val) => val === undefined || (val > 0), {
        message: 'Threshold in MB must be a positive number',
      }),
  }),
};
