import { z } from 'zod';

export const createWorkspaceSchema = {
  body: z.object({
    name: z.string().min(3, 'Workspace name must be at least 3 characters').max(100),
    slug: z
      .string()
      .min(3, 'Slug must be at least 3 characters')
      .max(50)
      .regex(/^[a-z0-9-]+$/, 'Slug must only contain lowercase letters, numbers, and hyphens'),
    description: z.string().max(500).optional(),
  }),
};

export const updateWorkspaceSchema = {
  body: z.object({
    name: z.string().min(3, 'Workspace name must be at least 3 characters').max(100).optional(),
    slug: z
      .string()
      .min(3, 'Slug must be at least 3 characters')
      .max(50)
      .regex(/^[a-z0-9-]+$/, 'Slug must only contain lowercase letters, numbers, and hyphens')
      .optional(),
    description: z.string().max(500).optional(),
    workspaceStatus: z.enum(['ACTIVE', 'SUSPENDED']).optional(),
  }),
};

export const inviteMemberSchema = {
  body: z.object({
    email: z.string().email('Invalid email address format'),
    role: z.enum(['ADMIN', 'MANAGER', 'EDITOR', 'MEMBER', 'VIEWER']),
  }),
};

export const updateMemberRoleSchema = {
  body: z.object({
    role: z.enum(['ADMIN', 'MANAGER', 'EDITOR', 'MEMBER', 'VIEWER']),
  }),
};

export const acceptInvitationSchema = {
  body: z.object({
    token: z.string().min(1, 'Token is required'),
  }),
};
