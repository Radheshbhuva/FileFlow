import { z } from 'zod';

export const createUploadSchema = {
  body: z.object({
    fileName: z.string().min(1, 'File Name is required').max(255),
    fileSize: z.number().int().positive('File Size must be a positive integer'),
    mimeType: z.string().min(1, 'MIME Type is required'),
    uploadMethod: z.enum(['STANDARD', 'MULTIPART', 'CHUNKED']),
  }),
};

export const trackProgressSchema = {
  body: z.object({
    uploadProgress: z.number().int().min(0, 'Progress cannot be negative').max(100, 'Progress cannot exceed 100'),
  }),
};
