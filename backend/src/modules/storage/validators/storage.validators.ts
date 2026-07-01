import { z } from 'zod';

export const presignedUploadSchema = {
  body: z.object({
    key: z.string().min(1, 'Key is required').max(1024),
    expiresIn: z.number().int().min(1).max(604800).optional(),
  }),
};

export const presignedDownloadSchema = {
  body: z.object({
    key: z.string().min(1, 'Key is required').max(1024),
    expiresIn: z.number().int().min(1).max(604800).optional(),
  }),
};

export const fileKeyQuerySchema = {
  query: z.object({
    key: z.string().min(1, 'Key is required').max(1024),
  }),
};

export const moveCopySchema = {
  body: z.object({
    sourceKey: z.string().min(1, 'Source key is required').max(1024),
    destKey: z.string().min(1, 'Destination key is required').max(1024),
  }),
};

export const directUploadSchema = {
  body: z.object({
    key: z.string().min(1, 'Key is required').max(1024),
    fileBase64: z.string().min(1, 'File content base64 is required'),
    mimeType: z.string().min(1, 'Mime type is required').max(100),
  }),
};

export const renameSchema = {
  body: z.object({
    sourceKey: z.string().min(1, 'Source key is required').max(1024),
    destKey: z.string().min(1, 'Destination key is required').max(1024),
  }),
};
