import { z } from 'zod';

export const createShareSchema = {
  body: z.object({
    fileId: z.string().uuid('Invalid file ID format'),
    accessLevel: z.enum(['VIEW', 'DOWNLOAD', 'EDIT', 'FULL_ACCESS']).optional().default('VIEW'),
    maxDownloads: z.number().int().positive('Max downloads must be a positive integer').optional(),
    expiryDate: z
      .string()
      .datetime({ message: 'Expiry date must be a valid ISO datetime' })
      .refine((val) => new Date(val) > new Date(), {
        message: 'Expiry date must be in the future',
      })
      .optional(),
    password: z.string().min(4, 'Password must be at least 4 characters long').max(50).optional(),
    sharedWith: z.string().optional(),
  }),
};

export const updateShareSchema = {
  body: z.object({
    accessLevel: z.enum(['VIEW', 'DOWNLOAD', 'EDIT', 'FULL_ACCESS']).optional(),
    maxDownloads: z.number().int().positive('Max downloads must be a positive integer').nullable().optional(),
    expiryDate: z
      .string()
      .datetime({ message: 'Expiry date must be a valid ISO datetime' })
      .refine((val) => new Date(val) > new Date(), {
        message: 'Expiry date must be in the future',
      })
      .nullable()
      .optional(),
    password: z.string().min(4, 'Password must be at least 4 characters long').max(50).nullable().optional(),
    shareStatus: z.enum(['ACTIVE', 'EXPIRED', 'REVOKED', 'DISABLED']).optional(),
  }),
};

export const extendExpirySchema = {
  body: z.object({
    expiryDate: z
      .string()
      .datetime({ message: 'Expiry date must be a valid ISO datetime' })
      .refine((val) => new Date(val) > new Date(), {
        message: 'Expiry date must be in the future',
      }),
  }),
};

export const verifyPasswordSchema = {
  body: z.object({
    password: z.string().min(1, 'Password is required'),
  }),
};
