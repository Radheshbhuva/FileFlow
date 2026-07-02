import { WorkspaceOverview, StorageIntelligence, SecurityIntelligence, ProductivityInsights, DashboardInsights, DashboardNotification } from '../interfaces/dashboard.interface';
import { FileRepository } from '../../files/interfaces/file.interface';
import { ShareRepository } from '../../shares/interfaces/share.interface';
import { UserRepository } from '../../auth/interfaces/user.interface';
import { Activity, ActivityRepository } from '../../activity/interfaces/activity.interface';
import { RepositoryRegistry } from '../../database/repositories/registry';
import { NotFoundError } from '../../../utils/app-error';

export class DashboardService {
  private fileRepository: FileRepository;
  private shareRepository: ShareRepository;
  private userRepository: UserRepository;
  private activityRepository: ActivityRepository;

  constructor(
    fileRepository: FileRepository = RepositoryRegistry.getFileRepository(),
    shareRepository: ShareRepository = RepositoryRegistry.getShareRepository(),
    userRepository: UserRepository = RepositoryRegistry.getUserRepository(),
    activityRepository: ActivityRepository = RepositoryRegistry.getActivityRepository()
  ) {
    this.fileRepository = fileRepository;
    this.shareRepository = shareRepository;
    this.userRepository = userRepository;
    this.activityRepository = activityRepository;
  }

  /**
   * Retrieves overview count parameters
   */
  public async getWorkspaceOverview(userId: string): Promise<WorkspaceOverview> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User profile not found');
    }

    const { files } = await this.fileRepository.findAll(userId, {}, { page: 1, limit: 100000 }, { sortBy: 'createdAt', sortOrder: 'desc' });
    const shares = await this.shareRepository.findAll(userId);

    const totalFiles = files.length;
    const totalShares = shares.length;
    const favoritesCount = files.filter((f) => f.favorite).length;
    const storageUsed = user.storageUsed || 0;
    const storageLimit = user.storageLimit || 5 * 1024 * 1024 * 1024;
    const storageRemaining = Math.max(0, storageLimit - storageUsed);
    const needsAttentionCount = files.filter((f) => f.securityScore < 70).length;

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentlyModifiedCount = files.filter((f) => f.updatedAt >= oneDayAgo).length;

    return {
      totalFiles,
      totalShares,
      favoritesCount,
      storageUsed,
      storageLimit,
      storageRemaining,
      needsAttentionCount,
      recentlyModifiedCount,
    };
  }

  /**
   * Evaluates storage trends and largest files
   */
  public async getStorageIntelligence(userId: string): Promise<StorageIntelligence> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User profile not found');
    }

    const { files } = await this.fileRepository.findAll(userId, {}, { page: 1, limit: 100000 }, { sortBy: 'createdAt', sortOrder: 'desc' });
    const storageUsed = user.storageUsed || 0;
    const storageLimit = user.storageLimit || 5 * 1024 * 1024 * 1024;
    const usagePercentage = Number(((storageUsed / storageLimit) * 100).toFixed(2)) || 0;

    // Largest files
    const largestFiles = [...files]
      .sort((a, b) => b.fileSize - a.fileSize)
      .slice(0, 5)
      .map((f) => ({ id: f.id, fileName: f.fileName, fileSize: f.fileSize }));

    // File types breakdown
    const fileTypesMap = new Map<string, { extension: string; count: number; bytes: number }>();
    files.forEach((f) => {
      const ext = f.fileType || 'bin';
      const current = fileTypesMap.get(ext) || { extension: ext, count: 0, bytes: 0 };
      current.count += 1;
      current.bytes += f.fileSize;
      fileTypesMap.set(ext, current);
    });
    const topFileTypes = Array.from(fileTypesMap.values()).sort((a, b) => b.bytes - a.bytes).slice(0, 5);

    // Storage growth monthly snapshots (past 6 months)
    const storageTrends = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleString('default', { month: 'short' });
      // Calculate cumulative storage uploaded up to this month
      const limitDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const bytesUsed = files
        .filter((f) => f.createdAt <= limitDate)
        .reduce((sum, f) => sum + f.fileSize, 0);
      storageTrends.push({ month: monthName, bytesUsed });
    }

    // Monthly Growth (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const monthlyGrowthEstimate = files
      .filter((f) => f.createdAt >= thirtyDaysAgo)
      .reduce((sum, f) => sum + f.fileSize, 0);

    return {
      storageUsed,
      storageAvailable: Math.max(0, storageLimit - storageUsed),
      usagePercentage,
      largestFiles,
      storageTrends,
      topFileTypes,
      monthlyGrowthEstimate,
    };
  }

  /**
   * Resolves security scores and recommendations
   */
  public async getSecurityIntelligence(userId: string): Promise<SecurityIntelligence> {
    const { files } = await this.fileRepository.findAll(userId, {}, { page: 1, limit: 100000 }, { sortBy: 'createdAt', sortOrder: 'desc' });
    const shares = await this.shareRepository.findAll(userId);
    const activeShares = shares.filter((s) => s.shareStatus === 'ACTIVE');
    const expiredShares = shares.filter((s) => s.shareStatus === 'EXPIRED').length;

    const totalFiles = files.length;
    const totalScore = files.reduce((sum, f) => sum + f.securityScore, 0);
    const averageFileSecurityScore = totalFiles > 0 ? Math.round(totalScore / totalFiles) : 100;

    const filesNeedingAttention = files
      .filter((f) => f.securityScore < 70)
      .sort((a, b) => a.securityScore - b.securityScore)
      .map((f) => ({ id: f.id, fileName: f.fileName, securityScore: f.securityScore }));

    // Evaluate Share Security Score component
    let shareSecurityScore = 100;
    if (activeShares.length > 0) {
      let sharePenalty = 0;
      activeShares.forEach((s) => {
        if (!s.passwordProtected) sharePenalty += 15;
        if (!s.expiryDate) sharePenalty += 10;
        if (!s.maxDownloads) sharePenalty += 5;
      });
      shareSecurityScore = Math.max(0, 100 - Math.round(sharePenalty / activeShares.length));
    }

    const workspaceSecurityScore = Math.round(averageFileSecurityScore * 0.6 + shareSecurityScore * 0.4);

    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    if (workspaceSecurityScore < 50) {
      riskLevel = 'HIGH';
    } else if (workspaceSecurityScore < 80) {
      riskLevel = 'MEDIUM';
    }

    // Dynamic recommendations compile
    const securityRecommendations: string[] = [];
    const unprotectedCount = activeShares.filter((s) => !s.passwordProtected).length;
    if (unprotectedCount > 0) {
      securityRecommendations.push(`Add passwords to ${unprotectedCount} unprotected active sharing links.`);
    }

    const infiniteCount = activeShares.filter((s) => !s.expiryDate).length;
    if (infiniteCount > 0) {
      securityRecommendations.push(`Configure expiration dates on ${infiniteCount} active sharing links to restrict persistent access.`);
    }

    const vulnerableCount = filesNeedingAttention.length;
    if (vulnerableCount > 0) {
      securityRecommendations.push(`Review ${vulnerableCount} files with vulnerable ratings (scores below 70).`);
    }

    if (securityRecommendations.length === 0) {
      securityRecommendations.push('Workspace meets all FileFlow security recommendations. Keep it up!');
    }

    return {
      averageSecurityScore: averageFileSecurityScore,
      publicShares: activeShares.length,
      expiredShares,
      filesNeedingAttention,
      riskLevel,
      securityRecommendations,
      securityScoreBreakdown: {
        workspaceSecurityScore,
        averageFileSecurityScore,
        shareSecurityScore,
      },
    };
  }

  /**
   * Gathers productivity and download charts
   */
  public async getProductivityInsights(userId: string): Promise<ProductivityInsights> {
    const { files } = await this.fileRepository.findAll(userId, {}, { page: 1, limit: 100000 }, { sortBy: 'createdAt', sortOrder: 'desc' });
    const shares = await this.shareRepository.findAll(userId);

    // Most accessed files
    const fileDownloads = new Map<string, number>();
    shares.forEach((s) => {
      fileDownloads.set(s.fileId, (fileDownloads.get(s.fileId) || 0) + s.downloadCount);
    });

    const mostAccessedFiles = await Promise.all(
      Array.from(fileDownloads.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(async ([fileId, count]) => {
          const file = await this.fileRepository.findById(fileId);
          return { id: fileId, fileName: file ? file.fileName : 'Unknown File', downloadCount: count };
        })
    );

    // Most shared files
    const fileSharesCount = new Map<string, number>();
    shares.forEach((s) => {
      fileSharesCount.set(s.fileId, (fileSharesCount.get(s.fileId) || 0) + 1);
    });

    const mostSharedFiles = await Promise.all(
      Array.from(fileSharesCount.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(async ([fileId, count]) => {
          const file = await this.fileRepository.findById(fileId);
          return { id: fileId, fileName: file ? file.fileName : 'Unknown File', shareCount: count };
        })
    );

    // Recent uploads
    const recentUploads = [...files]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 5)
      .map((f) => ({ id: f.id, fileName: f.fileName, createdAt: f.createdAt }));

    // Favorites list
    const favoriteFiles = files
      .filter((f) => f.favorite)
      .slice(0, 5)
      .map((f) => ({ id: f.id, fileName: f.fileName }));

    // Activity download trends (past 7 days)
    const recentActivityTrends = [];
    const now = new Date();
    const activities = await this.activityRepository.findRecent(userId, 500);
    const downloads = activities.filter((a) => a.activityType === 'SHARE_DOWNLOADED');

    for (let i = 6; i >= 0; i--) {
      const targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dateString = targetDate.toLocaleDateString('default', { month: 'short', day: 'numeric' });
      
      const count = downloads.filter((d) => {
        const dDate = new Date(d.createdAt);
        return dDate.getFullYear() === targetDate.getFullYear() &&
               dDate.getMonth() === targetDate.getMonth() &&
               dDate.getDate() === targetDate.getDate();
      }).length;

      recentActivityTrends.push({ date: dateString, downloadsCount: count });
    }

    return {
      mostAccessedFiles,
      mostSharedFiles,
      recentUploads,
      favoriteFiles,
      recentActivityTrends,
    };
  }

  /**
   * Generates the dynamic Workspace Health Score (0 to 100)
   */
  public async getWorkspaceHealthScore(userId: string): Promise<number> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User profile not found');
    }

    const { files } = await this.fileRepository.findAll(userId, {}, { page: 1, limit: 100000 }, { sortBy: 'createdAt', sortOrder: 'desc' });
    const shares = await this.shareRepository.findAll(userId);
    const activeShares = shares.filter((s) => s.shareStatus === 'ACTIVE');

    // 1. Security component (40%)
    const fileTotalScore = files.reduce((sum, f) => sum + f.securityScore, 0);
    const securityComponent = files.length > 0 ? Math.round(fileTotalScore / files.length) : 100;

    // 2. Storage component (25%)
    const storageUsed = user.storageUsed || 0;
    const storageLimit = user.storageLimit || 5 * 1024 * 1024 * 1024;
    const usagePercentage = (storageUsed / storageLimit) * 100;
    const storageComponent = Math.max(0, 100 - usagePercentage);

    // 3. Share Hygiene component (20%)
    let shareComponent = 100;
    if (activeShares.length > 0) {
      let sharePenalty = 0;
      activeShares.forEach((s) => {
        if (!s.passwordProtected) sharePenalty += 15;
        if (!s.expiryDate) sharePenalty += 10;
        if (!s.maxDownloads) sharePenalty += 5;
      });
      shareComponent = Math.max(0, 100 - Math.round(sharePenalty / activeShares.length));
    }

    // 4. Activity Health component (15%)
    const recentActivities = await this.activityRepository.findRecent(userId, 100);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const criticalEvents = recentActivities.filter((a) => {
      const isCritical = a.severity === 'CRITICAL' || a.activityType === 'UPLOAD_FAILED';
      const isRecent = new Date(a.createdAt) >= sevenDaysAgo;
      return isCritical && isRecent;
    }).length;
    const activityComponent = Math.max(0, 100 - criticalEvents * 15);

    // Weight aggregations
    const healthScore = Math.round(
      securityComponent * 0.4 +
      storageComponent * 0.25 +
      shareComponent * 0.2 +
      activityComponent * 0.15
    );

    return Math.max(0, Math.min(100, healthScore));
  }

  /**
   * Retrieves recent activity records for the user
   */
  public async getRecentActivity(userId: string): Promise<Activity[]> {
    return this.activityRepository.findRecent(userId, 50);
  }

  /**
   * Generates dynamic strategic dashboard insights
   */
  public async getDashboardInsights(userId: string): Promise<DashboardInsights> {
    const { files } = await this.fileRepository.findAll(userId, {}, { page: 1, limit: 100000 }, { sortBy: 'createdAt', sortOrder: 'desc' });
    const shares = await this.shareRepository.findAll(userId);
    const activities = await this.activityRepository.findRecent(userId, 500);

    // Largest File
    const sortedBySize = [...files].sort((a, b) => b.fileSize - a.fileSize);
    const largestFile = sortedBySize.length > 0 ? { fileName: sortedBySize[0].fileName, fileSize: sortedBySize[0].fileSize } : undefined;

    // Most Recent Upload
    const sortedByCreated = [...files].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const mostRecentUpload = sortedByCreated.length > 0 ? { fileName: sortedByCreated[0].fileName, createdAt: sortedByCreated[0].createdAt } : undefined;

    // Most Shared File
    const fileSharesCount = new Map<string, number>();
    shares.forEach((s) => {
      fileSharesCount.set(s.fileId, (fileSharesCount.get(s.fileId) || 0) + 1);
    });
    const sortedShares = Array.from(fileSharesCount.entries()).sort((a, b) => b[1] - a[1]);
    let mostSharedFile;
    if (sortedShares.length > 0) {
      const file = await this.fileRepository.findById(sortedShares[0][0]);
      if (file) {
        mostSharedFile = { fileName: file.fileName, shareCount: sortedShares[0][1] };
      }
    }

    // Most Active Day (Past 7 days)
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const activeDaysMap = new Map<string, number>();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    activities
      .filter((a) => new Date(a.createdAt) >= sevenDaysAgo)
      .forEach((a) => {
        const dayName = dayNames[new Date(a.createdAt).getDay()];
        activeDaysMap.set(dayName, (activeDaysMap.get(dayName) || 0) + 1);
      });

    const sortedDays = Array.from(activeDaysMap.entries()).sort((a, b) => b[1] - a[1]);
    const mostActiveDay = sortedDays.length > 0 ? { dayOfWeek: sortedDays[0][0], activityCount: sortedDays[0][1] } : undefined;

    // Least Used File (by downloads)
    let leastUsedFile;
    if (files.length > 0) {
      // Find file with lowest downloads sum in shares list
      const fileDownloads = new Map<string, number>();
      files.forEach((f) => fileDownloads.set(f.id, 0)); // initialize
      shares.forEach((s) => {
        if (fileDownloads.has(s.fileId)) {
          fileDownloads.set(s.fileId, fileDownloads.get(s.fileId)! + s.downloadCount);
        }
      });

      const sortedDownloads = Array.from(fileDownloads.entries()).sort((a, b) => a[1] - b[1]);
      if (sortedDownloads.length > 0) {
        const file = await this.fileRepository.findById(sortedDownloads[0][0]);
        if (file) {
          leastUsedFile = { fileName: file.fileName, fileSize: file.fileSize };
        }
      }
    }

    const filesRequiringAttentionCount = files.filter((f) => f.securityScore < 70).length;

    return {
      mostSharedFile,
      largestFile,
      mostActiveDay,
      leastUsedFile,
      filesRequiringAttentionCount,
      mostRecentUpload,
    };
  }

  /**
   * Generates live workspace alerts and notices
   */
  public async getNotifications(userId: string): Promise<DashboardNotification[]> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User profile not found');
    }

    const { files } = await this.fileRepository.findAll(userId, {}, { page: 1, limit: 100000 }, { sortBy: 'createdAt', sortOrder: 'desc' });
    const shares = await this.shareRepository.findAll(userId);
    const activeShares = shares.filter((s) => s.shareStatus === 'ACTIVE');

    const notifications: DashboardNotification[] = [];

    // 1. Storage notifications
    const storageUsed = user.storageUsed || 0;
    const storageLimit = user.storageLimit || 5 * 1024 * 1024 * 1024;
    const usagePercentage = (storageUsed / storageLimit) * 100;

    if (usagePercentage >= 90) {
      notifications.push({
        id: 'notify-storage-critical',
        type: 'CRITICAL',
        title: 'Storage Limit Exhausted',
        message: `Your storage usage is at ${usagePercentage.toFixed(1)}%. Upgrade your plan immediately to prevent upload blockages.`,
        createdAt: new Date(),
      });
    } else if (usagePercentage >= 75) {
      notifications.push({
        id: 'notify-storage-warning',
        type: 'WARNING',
        title: 'Storage Usage Warning',
        message: `Your storage is running low (currently at ${usagePercentage.toFixed(1)}%). Consider archiving unused files.`,
        createdAt: new Date(),
      });
    }

    // 2. Security notifications
    const highlyVulnerable = files.filter((f) => f.securityScore < 50);
    if (highlyVulnerable.length > 0) {
      notifications.push({
        id: 'notify-security-critical',
        type: 'CRITICAL',
        title: 'Vulnerable Files Detected',
        message: `FileFlow identified ${highlyVulnerable.length} files with critical security vulnerabilities. Review them now.`,
        createdAt: new Date(),
      });
    }

    // 3. Sharing notifications
    const unprotected = activeShares.filter((s) => !s.passwordProtected);
    if (unprotected.length > 3) {
      notifications.push({
        id: 'notify-share-warning',
        type: 'WARNING',
        title: 'Multiple Unsecured Shares',
        message: `You have ${unprotected.length} active sharing links with no password locks. Secure these links to protect sensitive details.`,
        createdAt: new Date(),
      });
    }

    return notifications;
  }
}
