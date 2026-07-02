import { z } from 'zod';

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const strongPassword = z.string()
  .min(8, 'New password must be at least 8 characters long')
  .max(100, 'New password must not exceed 100 characters')
  .regex(
    passwordRegex,
    'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)'
  );

export const updateProfileSchema = {
  body: z.object({
    fullName: z.string().min(2, 'Full Name must be at least 2 characters').max(100).optional(),
    avatar: z.string().url('Avatar must be a valid URL').optional().or(z.string().length(0)),
    timezone: z.string().max(100).optional(),
    company: z.string().max(100).optional(),
    jobTitle: z.string().max(100).optional(),
  }),
};

export const updateAvatarSchema = {
  body: z.object({
    avatar: z.string().url('Avatar must be a valid URL'),
  }),
};

export const changePasswordSchema = {
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: strongPassword,
    confirmPassword: z.string(),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: 'New passwords do not match',
    path: ['confirmPassword'],
  }),
};
