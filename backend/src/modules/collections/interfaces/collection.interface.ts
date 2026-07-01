import { File } from '../../files/interfaces/file.interface';
import { Activity } from '../../activity/interfaces/activity.interface';

export interface CollectionSummaryItem {
  id: string;
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
  lastSharedDate: Date;
  downloadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface FavoritesCollection {
  files: File[];
  favoriteCount: number;
  recentFavoriteActivity: Activity[];
}

export interface LargeFilesCollectionItem {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  securityScore: number;
  storageImpact: number; // percentage of user limit
  createdAt: Date;
  updatedAt: Date;
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
    createdAt: Date;
    updatedAt: Date;
  };
  reasons: Array<
    | 'LOW_SECURITY_SCORE'
    | 'UNPROTECTED_SHARE'
    | 'INACTIVE_FILE'
    | 'HIGH_RISK_SHARE'
    | 'EXECUTABLE_RISK'
  >;
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
    largeFilesRatio: number; // largeFilesBytes / totalStorageUsed
    needsAttentionRatio: number; // needsAttentionCount / totalFiles
  };
  healthIndicators: {
    averageSecurityScore: number;
    unsecuredShareCount: number;
    cleanFilesCount: number; // securityScore >= 80
  };
}

// ==========================================
// AI Preparation Interfaces (Future Roadmaps)
// ==========================================

export interface AIRecommendedFile {
  fileId: string;
  fileName: string;
  recommendationReason: string;
  confidenceScore: number; // 0.0 to 1.0
  recommendedAt: Date;
}

export interface FrequentlyAccessedFile {
  fileId: string;
  fileName: string;
  accessCount: number;
  lastAccessTime: Date;
}

export interface ArchiveCandidate {
  fileId: string;
  fileName: string;
  lastAccessedAt: Date;
  estimatedStorageSavings: number; // in bytes
  archivalReason: string;
}

export interface SecurityRiskCandidate {
  fileId: string;
  fileName: string;
  riskType: string;
  riskScore: number; // 0 to 100
}

export interface TeamHotFile {
  fileId: string;
  fileName: string;
  activityVelocity: number; // accesses/shares per hour
  departmentId?: string;
}
