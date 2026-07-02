import { FileRepository, File } from '../../files/interfaces/file.interface';
import { ShareRepository } from '../../shares/interfaces/share.interface';
import { UserRepository } from '../../auth/interfaces/user.interface';
import { ActivityRepository, Activity } from '../../activity/interfaces/activity.interface';
import { SearchService } from '../../search/services/search.service';
import { RepositoryRegistry } from '../../database/repositories/registry';
import {
  WorkspaceOverviewAnalytics,
  StorageAnalytics,
  SharingAnalytics,
  ProductivityAnalytics,
  SecurityAnalytics,
  ActivityAnalytics,
  SearchAnalytics,
  WorkspaceHealthReport,
  ProductivityInsights,
  ReportPayload,
  FileFlowReportExporter,
  ReportSchedule,
  ReportScheduler
} from '../interfaces/analytics.interface';
import { NotFoundError } from '../../../utils/app-error';

export class AnalyticsService implements FileFlowReportExporter, ReportScheduler {
  private fileRepository: FileRepository;
  private shareRepository: ShareRepository;
  private userRepository: UserRepository;
  private activityRepository: ActivityRepository;
  private searchService: SearchService;

  constructor(
    fileRepository: FileRepository = RepositoryRegistry.getFileRepository(),
    shareRepository: ShareRepository = RepositoryRegistry.getShareRepository(),
    userRepository: UserRepository = RepositoryRegistry.getUserRepository(),
    activityRepository: ActivityRepository = RepositoryRegistry.getActivityRepository(),
    searchService: SearchService = new SearchService()
  ) {
    this.fileRepository = fileRepository;
    this.shareRepository = shareRepository;
    this.userRepository = userRepository;
    this.activityRepository = activityRepository;
    this.searchService = searchService;
  }

  /**
   * Helper caching template for Redis scaling.
   */
  private async getCachedOrCompute<T>(cacheKey: string, computeFn: () => Promise<T>): Promise<T> {
    // Redis integration placeholder:
    // const cached = await this.redis.get(cacheKey);
    // if (cached) return JSON.parse(cached);
    const result = await computeFn();
    // await this.redis.setex(cacheKey, 300, JSON.stringify(result));
    return result;
  }

  /**
   * Helper to format Date into YYYY-MM-DD
   */
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Overview endpoint analytics
   */
  public async getOverview(userId: string): Promise<WorkspaceOverviewAnalytics> {
    return this.getCachedOrCompute(`analytics:overview:${userId}`, async () => {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new NotFoundError('User profile not found');
      }

      const { files } = await this.fileRepository.findAll(
        userId,
        { status: 'ACTIVE' },
        { page: 1, limit: 100000 },
        { sortBy: 'createdAt', sortOrder: 'desc' }
      );

      const shares = await this.shareRepository.findAll(userId);
      const activitySummary = await this.activityRepository.getSummary(userId);

      const storageUsed = user.storageUsed || 0;
      const storageLimit = user.storageLimit || 5 * 1024 * 1024 * 1024;
      const storagePercentage = Number(((storageUsed / storageLimit) * 100).toFixed(2)) || 0;

      return {
        totalFiles: files.length,
        totalUploads: activitySummary.uploads,
        totalShares: shares.length,
        favoritesCount: files.filter((f) => f.favorite).length,
        storageUsed,
        storageLimit,
        storagePercentage,
        recentActivityCount: activitySummary.recentActivityCount,
      };
    });
  }

  /**
   * Storage analytics
   */
  public async getStorageAnalytics(userId: string): Promise<StorageAnalytics> {
    return this.getCachedOrCompute(`analytics:storage:${userId}`, async () => {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new NotFoundError('User profile not found');
      }

      const { files } = await this.fileRepository.findAll(
        userId,
        { status: 'ACTIVE' },
        { page: 1, limit: 100000 },
        { sortBy: 'createdAt', sortOrder: 'desc' }
      );

      const storageUsed = user.storageUsed || 0;
      const storageLimit = user.storageLimit || 5 * 1024 * 1024 * 1024;
      const usagePercentage = Number(((storageUsed / storageLimit) * 100).toFixed(2)) || 0;

      // 30 days growth
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const recentFiles = files.filter((f) => f.createdAt >= thirtyDaysAgo);
      const storageGrowthBytes = recentFiles.reduce((sum, f) => sum + f.fileSize, 0);
      const prevStorageUsed = Math.max(1, storageUsed - storageGrowthBytes);
      const storageGrowthRate = Number(((storageGrowthBytes / prevStorageUsed) * 100).toFixed(2));

      // Largest files
      const largestFiles = [...files]
        .sort((a, b) => b.fileSize - a.fileSize)
        .slice(0, 5)
        .map((f) => ({ id: f.id, fileName: f.fileName, fileSize: f.fileSize }));

      // Top file types
      const typeMap = new Map<string, { extension: string; count: number; bytes: number }>();
      files.forEach((f) => {
        const ext = f.fileType || 'bin';
        const current = typeMap.get(ext) || { extension: ext, count: 0, bytes: 0 };
        current.count += 1;
        current.bytes += f.fileSize;
        typeMap.set(ext, current);
      });
      const topFileTypes = Array.from(typeMap.values())
        .sort((a, b) => b.bytes - a.bytes)
        .slice(0, 5);

      // Monthly trends (past 6 months)
      const storageTrends = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthName = date.toLocaleString('default', { month: 'short' });
        const limitDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        const bytes = files
          .filter((f) => f.createdAt <= limitDate)
          .reduce((sum, f) => sum + f.fileSize, 0);
        storageTrends.push({ month: monthName, bytesUsed: bytes });
      }

      return {
        storageUsed,
        storageAvailable: Math.max(0, storageLimit - storageUsed),
        usagePercentage,
        storageGrowthRate,
        storageGrowthBytes,
        largestFiles,
        topFileTypes,
        storageTrends,
      };
    });
  }

  /**
   * Sharing analytics
   */
  public async getSharingAnalytics(userId: string): Promise<SharingAnalytics> {
    return this.getCachedOrCompute(`analytics:sharing:${userId}`, async () => {
      const shares = await this.shareRepository.findAll(userId);
      const activeShares = shares.filter((s) => s.shareStatus === 'ACTIVE');
      const expiredShares = shares.filter((s) => s.shareStatus === 'EXPIRED');
      const revokedShares = shares.filter((s) => s.shareStatus === 'REVOKED' || s.shareStatus === 'DISABLED');

      // Sort files by downloads and shares count
      const shareCountMap = new Map<string, number>();
      const downloadCountMap = new Map<string, number>();

      shares.forEach((s) => {
        const currentShares = shareCountMap.get(s.fileId) || 0;
        shareCountMap.set(s.fileId, currentShares + 1);

        const currentDownloads = downloadCountMap.get(s.fileId) || 0;
        downloadCountMap.set(s.fileId, currentDownloads + s.downloadCount);
      });

      const { files } = await this.fileRepository.findAll(
        userId,
        { status: 'ACTIVE' },
        { page: 1, limit: 100000 },
        { sortBy: 'createdAt', sortOrder: 'desc' }
      );

      const mostSharedFiles = files
        .map((f) => ({
          fileId: f.id,
          fileName: f.fileName,
          shareCount: shareCountMap.get(f.id) || 0,
        }))
        .filter((item) => item.shareCount > 0)
        .sort((a, b) => b.shareCount - a.shareCount)
        .slice(0, 5);

      const mostDownloadedFiles = files
        .map((f) => ({
          fileId: f.id,
          fileName: f.fileName,
          downloadCount: downloadCountMap.get(f.id) || 0,
        }))
        .filter((item) => item.downloadCount > 0)
        .sort((a, b) => b.downloadCount - a.downloadCount)
        .slice(0, 5);

      // Sharing trends (daily counts past 30 days)
      const shareTrends = [];
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      // Group share creation dates and download events dates
      const dailyShares = new Map<string, number>();
      shares
        .filter((s) => s.createdAt >= thirtyDaysAgo)
        .forEach((s) => {
          const dateStr = this.formatDate(s.createdAt);
          dailyShares.set(dateStr, (dailyShares.get(dateStr) || 0) + 1);
        });

      const dailyDownloads = new Map<string, number>();
      const activities = await this.activityRepository.findRecent(userId, 5000);
      activities
        .filter((a) => a.activityType === 'SHARE_DOWNLOADED' && a.createdAt >= thirtyDaysAgo)
        .forEach((a) => {
          const dateStr = this.formatDate(a.createdAt);
          dailyDownloads.set(dateStr, (dailyDownloads.get(dateStr) || 0) + 1);
        });

      for (let i = 29; i >= 0; i--) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        const dateStr = this.formatDate(date);
        shareTrends.push({
          date: dateStr,
          sharesCount: dailyShares.get(dateStr) || 0,
          downloadsCount: dailyDownloads.get(dateStr) || 0,
        });
      }

      return {
        totalShares: shares.length,
        activeShares: activeShares.length,
        expiredShares: expiredShares.length,
        revokedShares: revokedShares.length,
        mostSharedFiles,
        mostDownloadedFiles,
        shareTrends,
      };
    });
  }

  /**
   * Productivity metrics
   */
  public async getProductivityAnalytics(userId: string): Promise<ProductivityAnalytics> {
    return this.getCachedOrCompute(`analytics:productivity:${userId}`, async () => {
      const activities = await this.activityRepository.findRecent(userId, 10000);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      // Daily uploads
      const uploadsMap = new Map<string, number>();
      activities
        .filter((a) => a.activityType === 'FILE_UPLOADED' && a.createdAt >= thirtyDaysAgo)
        .forEach((a) => {
          const dateStr = this.formatDate(a.createdAt);
          uploadsMap.set(dateStr, (uploadsMap.get(dateStr) || 0) + 1);
        });

      const uploadsPerDay = [];
      const sharesPerDay = [];
      const activityTrends = [];

      // Daily shares
      const sharesMap = new Map<string, number>();
      activities
        .filter(
          (a) =>
            (a.activityType === 'SHARE_CREATED' || a.activityType === 'FILE_SHARED') &&
            a.createdAt >= thirtyDaysAgo
        )
        .forEach((a) => {
          const dateStr = this.formatDate(a.createdAt);
          sharesMap.set(dateStr, (sharesMap.get(dateStr) || 0) + 1);
        });

      // Total activities daily
      const dailyTotalMap = new Map<string, number>();
      activities
        .filter((a) => a.createdAt >= thirtyDaysAgo)
        .forEach((a) => {
          const dateStr = this.formatDate(a.createdAt);
          dailyTotalMap.set(dateStr, (dailyTotalMap.get(dateStr) || 0) + 1);
        });

      for (let i = 29; i >= 0; i--) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        const dateStr = this.formatDate(date);
        uploadsPerDay.push({ date: dateStr, count: uploadsMap.get(dateStr) || 0 });
        sharesPerDay.push({ date: dateStr, count: sharesMap.get(dateStr) || 0 });
        activityTrends.push({ date: dateStr, count: dailyTotalMap.get(dateStr) || 0 });
      }

      // Most active days
      const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const activeDaysMap = new Map<string, number>();
      daysOfWeek.forEach((day) => activeDaysMap.set(day, 0));

      activities.forEach((a) => {
        const dayName = daysOfWeek[a.createdAt.getDay()];
        activeDaysMap.set(dayName, (activeDaysMap.get(dayName) || 0) + 1);
      });

      const mostActiveDays = Array.from(activeDaysMap.entries()).map(([dayOfWeek, activityCount]) => ({
        dayOfWeek,
        activityCount,
      }));

      // Productivity score calculation
      const uploadsCount = activities.filter((a) => a.activityType === 'FILE_UPLOADED').length;
      const downloadsCount = activities.filter((a) => a.activityType === 'SHARE_DOWNLOADED').length;
      const sharesCount = activities.filter(
        (a) => a.activityType === 'SHARE_CREATED' || a.activityType === 'FILE_SHARED'
      ).length;

      // Unique active days
      const activeDates = new Set(activities.map((a) => this.formatDate(a.createdAt)));
      const activeDaysCount = Math.max(1, activeDates.size);

      const productivityScore = Math.min(
        100,
        Math.round((uploadsCount * 5 + downloadsCount * 2 + sharesCount * 10) / activeDaysCount)
      );

      return {
        uploadsPerDay,
        sharesPerDay,
        mostActiveDays,
        activityTrends,
        productivityScore,
      };
    });
  }

  /**
   * Security posture details
   */
  public async getSecurityAnalytics(userId: string): Promise<SecurityAnalytics> {
    return this.getCachedOrCompute(`analytics:security:${userId}`, async () => {
      const { files } = await this.fileRepository.findAll(
        userId,
        { status: 'ACTIVE' },
        { page: 1, limit: 100000 },
        { sortBy: 'createdAt', sortOrder: 'desc' }
      );

      const shares = await this.shareRepository.findAll(userId);
      const activeShares = shares.filter((s) => s.shareStatus === 'ACTIVE');
      const expiredShares = shares.filter((s) => s.shareStatus === 'EXPIRED');

      let totalScore = 0;
      let highRiskCount = 0;
      let mediumRiskCount = 0;
      let lowRiskCount = 0;
      let extensionRisksCount = 0;

      const highRiskExts = ['exe', 'bat', 'sh', 'cmd', 'vbs', 'js', 'msi', 'scr'];

      files.forEach((file) => {
        totalScore += file.securityScore;

        if (file.securityScore < 50) {
          highRiskCount += 1;
        } else if (file.securityScore < 80) {
          mediumRiskCount += 1;
        } else {
          lowRiskCount += 1;
        }

        if (highRiskExts.includes(file.fileType.toLowerCase())) {
          extensionRisksCount += 1;
        }
      });

      const averageSecurityScore = files.length > 0 ? Math.round(totalScore / files.length) : 100;

      const publicSharesCount = activeShares.length;
      const expiredLinksCount = expiredShares.length;

      const unprotectedShares = activeShares.filter((s) => !s.passwordProtected && !s.expiryDate);
      const unsecuredShareLinksCount = unprotectedShares.length;

      const sharingRisksCount = activeShares.filter((s) => {
        // Active shares with low security rating of the file, or unprotected high downloads
        const file = files.find((f) => f.id === s.fileId);
        return !s.passwordProtected && (file ? file.securityScore < 60 : true);
      }).length;

      return {
        averageSecurityScore,
        riskLevels: {
          highRiskCount,
          mediumRiskCount,
          lowRiskCount,
        },
        publicSharesCount,
        expiredLinksCount,
        unsecuredShareLinksCount,
        riskBreakdown: {
          extensionRisksCount,
          sharingRisksCount,
          unprotectedShareCount: activeShares.filter((s) => !s.passwordProtected).length,
        },
      };
    });
  }

  /**
   * Activity metrics
   */
  public async getActivityAnalytics(userId: string): Promise<ActivityAnalytics> {
    return this.getCachedOrCompute(`analytics:activity:${userId}`, async () => {
      const activities = await this.activityRepository.findRecent(userId, 10000);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      // Volume by type
      const activityVolumeByType: Record<string, number> = {};
      activities.forEach((a) => {
        activityVolumeByType[a.activityType] = (activityVolumeByType[a.activityType] || 0) + 1;
      });

      // Daily activity trends
      const dailyMap = new Map<string, number>();
      activities
        .filter((a) => a.createdAt >= thirtyDaysAgo)
        .forEach((a) => {
          const dateStr = this.formatDate(a.createdAt);
          dailyMap.set(dateStr, (dailyMap.get(dateStr) || 0) + 1);
        });

      const activityTrends = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        const dateStr = this.formatDate(date);
        activityTrends.push({ date: dateStr, count: dailyMap.get(dateStr) || 0 });
      }

      // Top activities
      const topActivities = Object.entries(activityVolumeByType)
        .map(([activityType, count]) => ({ activityType, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      const recentActivityCount = activities.filter((a) => a.createdAt >= sevenDaysAgo).length;

      return {
        activityVolumeByType,
        activityTrends,
        topActivities,
        recentActivityCount,
      };
    });
  }

  /**
   * Search metrics from history logs
   */
  public async getSearchAnalytics(userId: string): Promise<SearchAnalytics> {
    return this.getCachedOrCompute(`analytics:search:${userId}`, async () => {
      const analytics = await this.searchService.getSearchAnalytics(userId);

      // Find popular files (the files returned matching queries or matches)
      const popularFiles: SearchAnalytics['popularFiles'] = [];
      const { files } = await this.fileRepository.findAll(
        userId,
        { status: 'ACTIVE' },
        { page: 1, limit: 100000 },
        { sortBy: 'createdAt', sortOrder: 'desc' }
      );

      // Basic mapping: match filename with top queries to assign match count
      files.forEach((file) => {
        let searchMatches = 0;
        analytics.topQueries.forEach((q) => {
          if (file.fileName.toLowerCase().includes(q.query.toLowerCase())) {
            searchMatches += q.frequency;
          }
        });
        if (searchMatches > 0) {
          popularFiles.push({ id: file.id, fileName: file.fileName, searchMatches });
        }
      });

      popularFiles.sort((a, b) => b.searchMatches - a.searchMatches).slice(0, 5);

      return {
        topSearches: analytics.topQueries,
        failedSearches: analytics.failedSearches,
        searchFrequency: analytics.searchFrequency,
        popularFiles,
        discoveryTrends: analytics.searchTrends,
      };
    });
  }

  /**
   * Workspace health scores
   */
  public async getWorkspaceHealth(userId: string): Promise<WorkspaceHealthReport> {
    const overview = await this.getOverview(userId);
    const security = await this.getSecurityAnalytics(userId);

    // 1. Storage Health: 100 - storagePercentage
    const storageHealth = Math.max(0, Math.min(100, Math.round(100 - overview.storagePercentage)));

    // 2. Security Health: Average security rating
    const securityHealth = security.averageSecurityScore;

    // 3. Activity Health: Recent action score
    // 5+ actions in past 7 days = 100, scaled down if lower
    const activityHealth = Math.min(100, Math.round((overview.recentActivityCount / 5) * 100));

    // 4. Collaboration Health: 100 minus penalty per unsecured share
    const collaborationHealth = Math.max(
      0,
      Math.min(100, 100 - security.unsecuredShareLinksCount * 15)
    );

    // Global Health Index
    const healthScore = Math.round(
      0.25 * storageHealth +
        0.35 * securityHealth +
        0.2 * activityHealth +
        0.2 * collaborationHealth
    );

    return {
      healthScore,
      storageHealth,
      securityHealth,
      activityHealth,
      collaborationHealth,
    };
  }

  /**
   * Insights engine
   */
  public async getInsights(userId: string): Promise<ProductivityInsights> {
    const { files } = await this.fileRepository.findAll(
      userId,
      { status: 'ACTIVE' },
      { page: 1, limit: 100000 },
      { sortBy: 'createdAt', sortOrder: 'desc' }
    );

    const shares = await this.shareRepository.findAll(userId);
    const activities = await this.activityRepository.findRecent(userId, 5000);

    const shareCountMap = new Map<string, number>();
    const downloadCountMap = new Map<string, number>();

    shares.forEach((s) => {
      shareCountMap.set(s.fileId, (shareCountMap.get(s.fileId) || 0) + 1);
      downloadCountMap.set(s.fileId, (downloadCountMap.get(s.fileId) || 0) + s.downloadCount);
    });

    // Most active file (shares + downloads)
    let mostActiveFile = null;
    let maxActivity = -1;

    // Most shared file
    let mostSharedFile = null;
    let maxShares = -1;

    // Most downloaded file
    let mostDownloadedFile = null;
    let maxDownloads = -1;

    files.forEach((f) => {
      const sCount = shareCountMap.get(f.id) || 0;
      const dCount = downloadCountMap.get(f.id) || 0;
      const totalAct = sCount + dCount;

      if (totalAct > maxActivity && totalAct > 0) {
        maxActivity = totalAct;
        mostActiveFile = { id: f.id, fileName: f.fileName, activityCount: totalAct };
      }

      if (sCount > maxShares && sCount > 0) {
        maxShares = sCount;
        mostSharedFile = { id: f.id, fileName: f.fileName, shareCount: sCount };
      }

      if (dCount > maxDownloads && dCount > 0) {
        maxDownloads = dCount;
        mostDownloadedFile = { id: f.id, fileName: f.fileName, downloadCount: dCount };
      }
    });

    // Most productive day
    let mostProductiveDay = null;
    const dailyActivities = new Map<string, number>();
    activities.forEach((a) => {
      const dateStr = this.formatDate(a.createdAt);
      dailyActivities.set(dateStr, (dailyActivities.get(dateStr) || 0) + 1);
    });

    let maxDayAct = -1;
    dailyActivities.forEach((count, dateStr) => {
      if (count > maxDayAct) {
        maxDayAct = count;
        mostProductiveDay = { date: dateStr, activityCount: count };
      }
    });

    // Least used file: active file, 0 downloads, 0 shares, oldest updatedAt
    const unusedFiles = files
      .filter((f) => (shareCountMap.get(f.id) || 0) === 0 && (downloadCountMap.get(f.id) || 0) === 0)
      .sort((a, b) => a.updatedAt.getTime() - b.updatedAt.getTime());

    const leastUsedFile =
      unusedFiles.length > 0
        ? { id: unusedFiles[0].id, fileName: unusedFiles[0].fileName, updatedAt: unusedFiles[0].updatedAt }
        : null;

    // Archive candidates: older than 30 days, inactive (0 downloads, 0 shares)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const archiveCandidates = unusedFiles
      .filter((f) => f.createdAt < thirtyDaysAgo)
      .map((f) => {
        const inactiveDays = Math.round(
          (Date.now() - f.updatedAt.getTime()) / (24 * 60 * 60 * 1000)
        );
        return {
          id: f.id,
          fileName: f.fileName,
          fileSize: f.fileSize,
          inactiveDays,
        };
      });

    return {
      mostActiveFile,
      mostSharedFile,
      mostDownloadedFile,
      mostProductiveDay,
      leastUsedFile,
      archiveCandidates,
    };
  }

  /**
   * Reports Engine: Daily, Weekly, Monthly summary generation
   */
  public async generateReport(
    userId: string,
    type: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM',
    options?: { startDate?: Date; endDate?: Date }
  ): Promise<ReportPayload> {
    const now = new Date();
    let startDate = new Date();
    let endDate = now;

    switch (type) {
      case 'DAILY':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        break;
      case 'WEEKLY':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'MONTHLY':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'CUSTOM':
        if (!options?.startDate || !options?.endDate) {
          throw new Error('Custom dates boundary limits are required');
        }
        startDate = options.startDate;
        endDate = options.endDate;
        break;
    }

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User profile not found');
    }

    // Load sub-analytics logs
    const overview = await this.getOverview(userId);
    const health = await this.getWorkspaceHealth(userId);
    const insights = await this.getInsights(userId);

    // Fetch and filter raw arrays by date range for report trends
    const { files } = await this.fileRepository.findAll(
      userId,
      { status: 'ACTIVE' },
      { page: 1, limit: 100000 },
      { sortBy: 'createdAt', sortOrder: 'desc' }
    );
    const shares = await this.shareRepository.findAll(userId);
    const activities = await this.activityRepository.findRecent(userId, 5000);

    const reportFiles = files.filter((f) => f.createdAt >= startDate && f.createdAt <= endDate);
    const reportShares = shares.filter((s) => s.createdAt >= startDate && s.createdAt <= endDate);
    const reportActivities = activities.filter((a) => a.createdAt >= startDate && a.createdAt <= endDate);

    // Trends graphs data
    const storageTrendsMap = new Map<string, number>();
    const activitiesTrendsMap = new Map<string, number>();
    const sharesTrendsMap = new Map<string, number>();

    // Initial default days range
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

    // Build trend logs
    for (let i = diffDays - 1; i >= 0; i--) {
      const date = new Date(endDate.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = this.formatDate(date);
      storageTrendsMap.set(dateStr, 0);
      activitiesTrendsMap.set(dateStr, 0);
      sharesTrendsMap.set(dateStr, 0);
    }

    reportFiles.forEach((f) => {
      const dateStr = this.formatDate(f.createdAt);
      if (storageTrendsMap.has(dateStr)) {
        storageTrendsMap.set(dateStr, (storageTrendsMap.get(dateStr) || 0) + f.fileSize);
      }
    });

    reportActivities.forEach((a) => {
      const dateStr = this.formatDate(a.createdAt);
      if (activitiesTrendsMap.has(dateStr)) {
        activitiesTrendsMap.set(dateStr, (activitiesTrendsMap.get(dateStr) || 0) + 1);
      }
    });

    reportShares.forEach((s) => {
      const dateStr = this.formatDate(s.createdAt);
      if (sharesTrendsMap.has(dateStr)) {
        sharesTrendsMap.set(dateStr, (sharesTrendsMap.get(dateStr) || 0) + 1);
      }
    });

    // Map to cumulative storage trends
    let runningStorageSum = overview.storageUsed - reportFiles.reduce((sum, f) => sum + f.fileSize, 0);
    const storageTrends: Array<{ date: string; bytesUsed: number }> = [];

    const sortedDates = Array.from(storageTrendsMap.keys()).sort((a, b) => a.localeCompare(b));
    sortedDates.forEach((dateStr) => {
      const addedBytes = storageTrendsMap.get(dateStr) || 0;
      runningStorageSum += addedBytes;
      storageTrends.push({ date: dateStr, bytesUsed: runningStorageSum });
    });

    const activitiesTrends = Array.from(activitiesTrendsMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const sharesTrends = Array.from(sharesTrendsMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      reportMetadata: {
        type,
        generatedAt: now,
        scope: `Workspace User: ${user.fullName}`,
        startDate,
        endDate,
      },
      overview,
      health,
      insights,
      trends: {
        storage: storageTrends,
        activities: activitiesTrends,
        shares: sharesTrends,
      },
    };
  }

  // =========================================================================
  // Exporter & Reporting Scheduler Stubs (Future roadmap contracts)
  // =========================================================================

  public async exportToCSV(report: ReportPayload): Promise<string> {
    // QuickSight / Excel placeholder interface contract
    return 'id,fileName,fileSize,downloads\n';
  }

  public async exportToPDF(report: ReportPayload): Promise<Buffer> {
    return Buffer.from('PDF Report Stub');
  }

  public async exportToExcel(report: ReportPayload): Promise<Buffer> {
    return Buffer.from('Excel Report Stub');
  }

  public async scheduleReport(
    userId: string,
    type: 'DAILY' | 'WEEKLY' | 'MONTHLY',
    cron: string,
    recipients: string[]
  ): Promise<ReportSchedule> {
    return {
      id: 'schedule_stub_id',
      userId,
      reportType: type,
      cronExpression: cron,
      recipientEmails: recipients,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  public async getScheduledReports(userId: string): Promise<ReportSchedule[]> {
    return [];
  }

  public async cancelScheduledReport(scheduleId: string): Promise<boolean> {
    return true;
  }
}
