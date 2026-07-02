export interface WorkspaceOverview {
  totalFiles: number;
  totalShares: number;
  favoritesCount: number;
  storageUsed: number;
  storageLimit: number;
  storageRemaining: number;
  needsAttentionCount: number;
  recentlyModifiedCount: number;
}

export interface StorageIntelligence {
  storageUsed: number;
  storageAvailable: number;
  usagePercentage: number;
  largestFiles: Array<{ id: string; fileName: string; fileSize: number }>;
  storageTrends: Array<{ month: string; bytesUsed: number }>;
  topFileTypes: Array<{ extension: string; count: number; bytes: number }>;
  monthlyGrowthEstimate: number; // in bytes
}

export interface SecurityIntelligence {
  averageSecurityScore: number;
  publicShares: number;
  expiredShares: number;
  filesNeedingAttention: Array<{ id: string; fileName: string; securityScore: number }>;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  securityRecommendations: string[];
  securityScoreBreakdown: {
    workspaceSecurityScore: number;
    averageFileSecurityScore: number;
    shareSecurityScore: number;
  };
}

export interface ProductivityInsights {
  mostAccessedFiles: Array<{ id: string; fileName: string; downloadCount: number }>;
  mostSharedFiles: Array<{ id: string; fileName: string; shareCount: number }>;
  recentUploads: Array<{ id: string; fileName: string; createdAt: Date }>;
  favoriteFiles: Array<{ id: string; fileName: string }>;
  recentActivityTrends: Array<{ date: string; downloadsCount: number }>;
}

export interface DashboardInsights {
  mostSharedFile?: { fileName: string; shareCount: number };
  largestFile?: { fileName: string; fileSize: number };
  mostActiveDay?: { dayOfWeek: string; activityCount: number };
  leastUsedFile?: { fileName: string; fileSize: number };
  filesRequiringAttentionCount: number;
  mostRecentUpload?: { fileName: string; createdAt: Date };
}

export interface DashboardNotification {
  id: string;
  type: 'INFO' | 'WARNING' | 'CRITICAL';
  title: string;
  message: string;
  createdAt: Date;
}
