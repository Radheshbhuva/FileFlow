import { z } from 'zod';

export const createFileSchema = {
  body: z.object({
    fileName: z.string().min(1, 'File Name is required').max(255),
    originalName: z.string().min(1, 'Original Name is required').max(255).optional(),
    fileType: z.string().min(1, 'File Type is required').max(20),
    mimeType: z.string().min(1, 'MIME Type is required').max(100),
    fileSize: z.number().int().positive('File Size must be a positive integer'),
  }),
};

export const updateFileSchema = {
  body: z.object({
    fileName: z.string().min(1, 'File Name must be at least 1 character').max(255).optional(),
    favorite: z.boolean().optional(),
    shareStatus: z.enum(['PRIVATE', 'SHARED']).optional(),
  }),
};

export const archiveFileSchema = {
  body: z.object({
    archive: z.boolean().optional(),
  }),
};

export const favoriteFileSchema = {
  body: z.object({
    favorite: z.boolean().optional(),
  }),
};
