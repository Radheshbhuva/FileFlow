import { z } from 'zod';

export const searchSchema = {
  query: z.object({
    query: z.string().optional(),
    fileType: z.string().optional(),
    startDate: z.preprocess((val) => (val ? new Date(val as string) : undefined), z.date().optional()),
    endDate: z.preprocess((val) => (val ? new Date(val as string) : undefined), z.date().optional()),
    minSize: z.coerce.number().int().nonnegative().optional(),
    maxSize: z.coerce.number().int().nonnegative().optional(),
    favorite: z.preprocess((val) => {
      if (val === 'true' || val === true) return true;
      if (val === 'false' || val === false) return false;
      return undefined;
    }, z.boolean().optional()),
    shareStatus: z.enum(['PRIVATE', 'SHARED']).optional(),
    minSecurityScore: z.coerce.number().int().min(0).max(100).optional(),
    maxSecurityScore: z.coerce.number().int().min(0).max(100).optional(),
    owner: z.string().optional(),
    collectionType: z.enum([
      'recently-modified',
      'shared-recently',
      'favorites',
      'large-files',
      'needs-attention',
    ]).optional(),
    sortBy: z.enum([
      'relevance',
      'recently_modified',
      'recently_uploaded',
      'file_size',
      'most_shared',
      'most_downloaded',
      'alphabetical',
    ]).default('relevance').optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc').optional(),
    page: z.coerce.number().int().min(1).default(1).optional(),
    limit: z.coerce.number().int().min(1).default(10).optional(),
  }),
};

export const searchSuggestionsSchema = {
  query: z.object({
    query: z.string().optional(),
  }),
};
