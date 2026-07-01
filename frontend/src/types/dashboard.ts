export type FileStatus = 'ready' | 'processing' | 'failed';
export type ShareStatus = 'active' | 'expired' | 'revoked';
export type ActivityType = 'upload' | 'share' | 'download' | 'profile' | 'revoke';

export interface DashboardUser {
  id: string;
  fullName: string;
  email: string;
  plan: string;
  accountCreated: string;
  lastLogin: string;
  avatarInitials: string;
}

export interface OverviewMetric {
  id: string;
  label: string;
  value: string;
  supportingText: string;
  icon: 'files' | 'storage' | 'shares' | 'team';
  progress?: number;
}

export interface StorageUsage {
  usedBytes: number;
  totalBytes: number;
  usedLabel: string;
  totalLabel: string;
  availableLabel: string;
  percentage: number;
}

export interface RecentUpload {
  id: string;
  fileName: string;
  type: string;
  size: string;
  uploadDate: string;
  status: FileStatus;
}

export interface SharedFile {
  id: string;
  fileName: string;
  sharedWith: string;
  shareDate: string;
  expiryDate: string;
  status: ShareStatus;
  shareLink: string;
}

export interface ActivityItem {
  id: string;
  type: ActivityType;
  description: string;
  timestamp: string;
  relativeTime: string;
}

export interface DashboardData {
  user: DashboardUser;
  overview: OverviewMetric[];
  storage: StorageUsage;
  recentUploads: RecentUpload[];
  sharedFiles: SharedFile[];
  activity: ActivityItem[];
}

export interface DashboardApiResponse {
  data: DashboardData | null;
  error: string | null;
}

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: 'dashboard' | 'files' | 'upload' | 'shared' | 'team' | 'settings' | 'search' | 'bell' | 'activity' | 'collections';
  badge?: string;
  disabled?: boolean;
}

export interface BackendWorkspaceOverview {
  totalFiles: number;
  totalShares: number;
  favoritesCount: number;
  storageUsed: number;
  storageLimit: number;
  storageRemaining: number;
  needsAttentionCount: number;
  recentlyModifiedCount: number;
}

export interface BackendStorageIntelligence {
  storageUsed: number;
  storageAvailable: number;
  usagePercentage: number;
  largestFiles: Array<{ id: string; fileName: string; fileSize: number }>;
  storageTrends: Array<{ month: string; bytesUsed: number }>;
  topFileTypes: Array<{ extension: string; count: number; bytes: number }>;
  monthlyGrowthEstimate: number;
}

export interface BackendSecurityIntelligence {
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

export interface BackendProductivityInsights {
  mostAccessedFiles: Array<{ id: string; fileName: string; downloadCount: number }>;
  mostSharedFiles: Array<{ id: string; fileName: string; shareCount: number }>;
  recentUploads: Array<{ id: string; fileName: string; createdAt: string }>;
  favoriteFiles: Array<{ id: string; fileName: string }>;
  recentActivityTrends: Array<{ date: string; downloadsCount: number }>;
}

export interface BackendDashboardInsights {
  mostSharedFile?: { fileName: string; shareCount: number };
  largestFile?: { fileName: string; fileSize: number };
  mostActiveDay?: { dayOfWeek: string; activityCount: number };
  leastUsedFile?: { fileName: string; fileSize: number };
  filesRequiringAttentionCount: number;
  mostRecentUpload?: { fileName: string; createdAt: string };
}

export interface BackendDashboardNotification {
  id: string;
  type: 'INFO' | 'WARNING' | 'CRITICAL';
  title: string;
  message: string;
  createdAt: string;
}

export interface BackendActivity {
  id: string;
  userId?: string;
  activityType: string;
  resourceType?: string;
  resourceId?: string;
  resourceName?: string;
  description: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  createdAt: string;
}

