import apiClient from './api/apiClient';
import { mapBackendFileToFrontendFile } from './fileService';
import type { File } from '../types/files';

export interface SearchQueryFilters {
  fileType?: string;
  startDate?: string;
  endDate?: string;
  minSize?: number;
  maxSize?: number;
  favorite?: boolean;
  shareStatus?: 'PRIVATE' | 'SHARED';
  minSecurityScore?: number;
  maxSecurityScore?: number;
  owner?: string;
  collectionType?: string;
}

export interface SearchQueryOptions {
  query?: string;
  filters?: SearchQueryFilters;
  sort?: {
    field: string;
    order: 'asc' | 'desc';
  };
  page?: number;
  limit?: number;
}

export const searchService = {
  searchFiles: async (options: SearchQueryOptions): Promise<{ files: File[]; total: number; page: number; limit: number }> => {
    // Transform Sort parameter names matching backend search service field mappings:
    // e.g. relevance, recently_modified, recently_uploaded, file_size, most_shared, most_downloaded, alphabetical
    const sortFieldMap: Record<string, string> = {
      relevance: 'relevance',
      lastModified: 'recently_modified',
      recentlyModified: 'recently_modified',
      createdAt: 'recently_uploaded',
      recentlyUploaded: 'recently_uploaded',
      size: 'file_size',
      fileSize: 'file_size',
      mostShared: 'most_shared',
      mostDownloaded: 'most_downloaded',
      name: 'alphabetical',
      alphabetical: 'alphabetical',
    };

    const sortBy = options.sort?.field ? (sortFieldMap[options.sort.field] || options.sort.field) : 'relevance';
    const sortOrder = options.sort?.order || 'desc';

    const params: any = {
      query: options.query || undefined,
      sortBy,
      sortOrder,
      page: options.page || 1,
      limit: options.limit || 10,
    };

    if (options.filters) {
      Object.entries(options.filters).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          params[key] = val;
        }
      });
    }

    const res = await apiClient.get('/search/files', { params });
    const { files = [], total = 0, page: resPage = 1, limit: resLimit = 10 } = res.data.data;

    return {
      files: files.map(mapBackendFileToFrontendFile),
      total,
      page: resPage,
      limit: resLimit,
    };
  },

  getRecentSearches: async (): Promise<string[]> => {
    const res = await apiClient.get('/search/recent');
    return res.data.data || [];
  },

  getSuggestions: async (partialQuery = ''): Promise<{
    recentSearches: string[];
    popularSearches: string[];
    suggestedFiles: File[];
    suggestedCollections: any[];
  }> => {
    const res = await apiClient.get('/search/suggestions', { params: { query: partialQuery } });
    const { recentSearches = [], popularSearches = [], suggestedFiles = [], suggestedCollections = [] } = res.data.data;

    return {
      recentSearches,
      popularSearches,
      suggestedFiles: suggestedFiles.map(mapBackendFileToFrontendFile),
      suggestedCollections,
    };
  },

  getDiscovery: async (): Promise<{
    recentlyModified: File[];
    frequentlyAccessed: File[];
    recentlyShared: File[];
    favorites: File[];
    largeFiles: File[];
    needsAttention: File[];
  }> => {
    const res = await apiClient.get('/search/discover');
    const {
      recentlyModified = [],
      frequentlyAccessed = [],
      recentlyShared = [],
      favorites = [],
      largeFiles = [],
      needsAttention = [],
    } = res.data.data.discover || res.data.data;

    return {
      recentlyModified: recentlyModified.map(mapBackendFileToFrontendFile),
      frequentlyAccessed: frequentlyAccessed.map(mapBackendFileToFrontendFile),
      recentlyShared: recentlyShared.map(mapBackendFileToFrontendFile),
      favorites: favorites.map(mapBackendFileToFrontendFile),
      largeFiles: largeFiles.map(mapBackendFileToFrontendFile),
      needsAttention: needsAttention.map(mapBackendFileToFrontendFile),
    };
  },

  getTrending: async (): Promise<{
    mostAccessed: File[];
    mostShared: File[];
    mostDownloaded: File[];
    mostFavorited: File[];
  }> => {
    const res = await apiClient.get('/search/trending');
    const { mostAccessed = [], mostShared = [], mostDownloaded = [], mostFavorited = [] } = res.data.data;

    return {
      mostAccessed: mostAccessed.map(mapBackendFileToFrontendFile),
      mostShared: mostShared.map(mapBackendFileToFrontendFile),
      mostDownloaded: mostDownloaded.map(mapBackendFileToFrontendFile),
      mostFavorited: mostFavorited.map(mapBackendFileToFrontendFile),
    };
  },
};
