import apiClient from './api/apiClient';
import { mapBackendFileToFrontendFile } from './fileService';
import type { File } from '../types/files';

export interface CollectionSummaryItem {
  id: 'recently-modified' | 'shared-recently' | 'favorites' | 'large-files' | 'needs-attention';
  name: string;
  description: string;
  endpoint: string;
  count: number;
}

export interface SharedRecentlyItem {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  securityScore: number;
  shareCount: number;
  lastSharedDate: string;
  downloadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface FavoritesCollection {
  files: File[];
  favoriteCount: number;
  recentFavoriteActivity: any[];
}

export interface LargeFilesCollectionItem {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  securityScore: number;
  storageImpact: number;
  createdAt: string;
  updatedAt: string;
}

export interface LargeFilesCollection {
  files: LargeFilesCollectionItem[];
  totalLargeFilesCount: number;
  totalLargeFilesSize: number;
  userStorageUsed: number;
  userStorageLimit: number;
  thresholdMb: number;
}

export interface NeedsAttentionItem {
  file: {
    id: string;
    fileName: string;
    fileSize: number;
    fileType: string;
    securityScore: number;
    createdAt: string;
    updatedAt: string;
  };
  reasons: Array<'LOW_SECURITY_SCORE' | 'UNPROTECTED_SHARE' | 'HIGH_RISK_SHARE' | 'INACTIVE_FILE' | 'EXECUTABLE_RISK'>;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface CollectionSummary {
  collectionCounts: {
    recentlyModified: number;
    sharedRecently: number;
    favorites: number;
    largeFiles: number;
    needsAttention: number;
  };
  storageConsumption: {
    recentlyModifiedBytes: number;
    sharedRecentlyBytes: number;
    favoritesBytes: number;
    largeFilesBytes: number;
    needsAttentionBytes: number;
  };
  collectionMetrics: {
    totalFiles: number;
    totalStorageUsed: number;
    largeFilesRatio: number;
    needsAttentionRatio: number;
  };
  healthIndicators: {
    averageSecurityScore: number;
    unsecuredShareCount: number;
    cleanFilesCount: number;
  };
}

export interface AIRecommendation {
  fileId: string;
  fileName: string;
  recommendationReason: string;
  confidenceScore: number;
  recommendedAt: string;
}

export interface FrequentlyAccessedFile {
  fileId: string;
  fileName: string;
  accessCount: number;
  lastAccessTime: string;
}

export interface ArchiveCandidate {
  fileId: string;
  fileName: string;
  lastAccessedAt: string;
  estimatedStorageSavings: number;
  archivalReason: string;
}

export interface SecurityRiskCandidate {
  fileId: string;
  fileName: string;
  riskType: string;
  riskScore: number;
}

export interface TeamHotFile {
  fileId: string;
  fileName: string;
  activityVelocity: number;
  departmentId: string;
}

export const collectionService = {
  getCollectionsList: async (): Promise<CollectionSummaryItem[]> => {
    const res = await apiClient.get('/collections');
    return res.data.data.collections;
  },

  getRecentlyModified: async (days = 7): Promise<File[]> => {
    const res = await apiClient.get('/collections/recently-modified', { params: { days } });
    const files = res.data.data.files || [];
    return files.map(mapBackendFileToFrontendFile);
  },

  getSharedRecently: async (days = 30): Promise<SharedRecentlyItem[]> => {
    const res = await apiClient.get('/collections/shared-recently', { params: { days } });
    return res.data.data.files || [];
  },

  getFavorites: async (): Promise<FavoritesCollection> => {
    const res = await apiClient.get('/collections/favorites');
    const { files = [], favoriteCount = 0, recentFavoriteActivity = [] } = res.data.data;
    return {
      files: files.map(mapBackendFileToFrontendFile),
      favoriteCount,
      recentFavoriteActivity,
    };
  },

  getLargeFiles: async (thresholdMb = 100): Promise<LargeFilesCollection> => {
    const res = await apiClient.get('/collections/large-files', { params: { thresholdMb } });
    return res.data.data;
  },

  getNeedsAttention: async (): Promise<NeedsAttentionItem[]> => {
    const res = await apiClient.get('/collections/needs-attention');
    return res.data.data.files || [];
  },

  getCollectionSummary: async (): Promise<CollectionSummary> => {
    const res = await apiClient.get('/collections/summary');
    return res.data.data.summary;
  },

  // AI and Future Preparation Endpoints
  getAIRecommendations: async (): Promise<AIRecommendation[]> => {
    const res = await apiClient.get('/collections/ai-recommendations');
    return res.data.data.recommendations || [];
  },

  getFrequentlyAccessed: async (): Promise<FrequentlyAccessedFile[]> => {
    const res = await apiClient.get('/collections/frequently-accessed');
    return res.data.data.files || [];
  },

  getArchiveCandidates: async (): Promise<ArchiveCandidate[]> => {
    const res = await apiClient.get('/collections/archive-candidates');
    return res.data.data.candidates || [];
  },

  getSecurityRisks: async (): Promise<SecurityRiskCandidate[]> => {
    const res = await apiClient.get('/collections/security-risks');
    return res.data.data.risks || [];
  },

  getTeamHotFiles: async (): Promise<TeamHotFile[]> => {
    const res = await apiClient.get('/collections/team-hot-files');
    return res.data.data.files || [];
  },
};
