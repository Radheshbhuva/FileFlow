import { File } from '../../files/interfaces/file.interface';

export interface WorkspaceOverviewAnalytics {
  totalFiles: number;
  totalUploads: number;
  totalShares: number;
  favoritesCount: number;
  storageUsed: number;
  storageLimit: number;
  storagePercentage: number;
  recentActivityCount: number;
}

export interface StorageAnalytics {
  storageUsed: number;
  storageAvailable: number;
  usagePercentage: number;
  storageGrowthRate: number; // Percent increase/decrease in past 30 days
  storageGrowthBytes: number; // Growth in absolute bytes past 30 days
  largestFiles: Array<{ id: string; fileName: string; fileSize: number }>;
  topFileTypes: Array<{ extension: string; count: number; bytes: number }>;
  storageTrends: Array<{ month: string; bytesUsed: number }>;
}

export interface SharingAnalytics {
  totalShares: number;
  activeShares: number;
  expiredShares: number;
  revokedShares: number;
  mostSharedFiles: Array<{ fileId: string; fileName: string; shareCount: number }>;
  mostDownloadedFiles: Array<{ fileId: string; fileName: string; downloadCount: number }>;
  shareTrends: Array<{ date: string; sharesCount: number; downloadsCount: number }>;
}

export interface ProductivityAnalytics {
  uploadsPerDay: Array<{ date: string; count: number }>;
  sharesPerDay: Array<{ date: string; count: number }>;
  mostActiveDays: Array<{ dayOfWeek: string; activityCount: number }>;
  activityTrends: Array<{ date: string; count: number }>;
  productivityScore: number;
}

export interface SecurityAnalytics {
  averageSecurityScore: number;
  riskLevels: {
    highRiskCount: number;    // Score < 50
    mediumRiskCount: number;  // Score 50 - 79
    lowRiskCount: number;     // Score >= 80
  };
  publicSharesCount: number;
  expiredLinksCount: number;
  unsecuredShareLinksCount: number;
  riskBreakdown: {
    extensionRisksCount: number;
    sharingRisksCount: number;
    unprotectedShareCount: number;
  };
}

export interface ActivityAnalytics {
  activityVolumeByType: Record<string, number>;
  activityTrends: Array<{ date: string; count: number }>;
  topActivities: Array<{ activityType: string; count: number }>;
  recentActivityCount: number;
}

export interface SearchAnalytics {
  topSearches: Array<{ query: string; frequency: number }>;
  failedSearches: Array<{ query: string; reason: string; timestamp: Date }>;
  searchFrequency: Record<string, number>;
  popularFiles: Array<{ id: string; fileName: string; searchMatches: number }>;
  discoveryTrends: Array<{ date: string; count: number }>;
}

export interface WorkspaceHealthReport {
  healthScore: number;
  storageHealth: number;
  securityHealth: number;
  activityHealth: number;
  collaborationHealth: number;
}

export interface ProductivityInsights {
  mostActiveFile: { id: string; fileName: string; activityCount: number } | null;
  mostSharedFile: { id: string; fileName: string; shareCount: number } | null;
  mostDownloadedFile: { id: string; fileName: string; downloadCount: number } | null;
  mostProductiveDay: { date: string; activityCount: number } | null;
  leastUsedFile: { id: string; fileName: string; updatedAt: Date } | null;
  archiveCandidates: Array<{ id: string; fileName: string; fileSize: number; inactiveDays: number }>;
}

export interface ReportPayload {
  reportMetadata: {
    type: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM';
    generatedAt: Date;
    scope: string;
    startDate: Date;
    endDate: Date;
  };
  overview: WorkspaceOverviewAnalytics;
  health: WorkspaceHealthReport;
  insights: ProductivityInsights;
  trends: {
    storage: Array<{ date: string; bytesUsed: number }>;
    activities: Array<{ date: string; count: number }>;
    shares: Array<{ date: string; count: number }>;
  };
}

// =========================================================================
// Export Engine & Reporting Scheduler (Future-ready scalable interfaces)
// =========================================================================

export interface FileFlowReportExporter {
  exportToCSV(report: ReportPayload): Promise<string>;
  exportToPDF(report: ReportPayload): Promise<Buffer>;
  exportToExcel(report: ReportPayload): Promise<Buffer>;
}

export interface ReportSchedule {
  id: string;
  userId: string;
  reportType: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  cronExpression: string;
  recipientEmails: string[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportScheduler {
  scheduleReport(
    userId: string,
    type: 'DAILY' | 'WEEKLY' | 'MONTHLY',
    cron: string,
    recipients: string[]
  ): Promise<ReportSchedule>;
  getScheduledReports(userId: string): Promise<ReportSchedule[]>;
  cancelScheduledReport(scheduleId: string): Promise<boolean>;
}
