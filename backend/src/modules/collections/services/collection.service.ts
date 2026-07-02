import {
  CollectionSummary,
  FavoritesCollection,
  LargeFilesCollection,
  LargeFilesCollectionItem,
  NeedsAttentionItem,
  SharedRecentlyItem,
  AIRecommendedFile,
  FrequentlyAccessedFile,
  ArchiveCandidate,
  SecurityRiskCandidate,
  TeamHotFile,
  CollectionSummaryItem
} from '../interfaces/collection.interface';
import { FileRepository, File } from '../../files/interfaces/file.interface';
import { ShareRepository } from '../../shares/interfaces/share.interface';
import { UserRepository } from '../../auth/interfaces/user.interface';
import { ActivityRepository } from '../../activity/interfaces/activity.interface';
import { RepositoryRegistry } from '../../database/repositories/registry';
import { NotFoundError } from '../../../utils/app-error';

export class CollectionService {
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
   * Caching Wrapper Placeholder
   */
  private async getCachedOrCompute<T>(cacheKey: string, computeFn: () => Promise<T>): Promise<T> {
    // Placeholder for future Redis/Memcached integration:
    // const cached = await this.redis.get(cacheKey);
    // if (cached) return JSON.parse(cached);

    const result = await computeFn();

    // Placeholder for future cache write:
    // await this.redis.setex(cacheKey, 60, JSON.stringify(result));
    return result;
  }

  /**
   * Lists all smart collections metadata and counts
   */
  public async getCollectionsList(userId: string): Promise<CollectionSummaryItem[]> {
    return this.getCachedOrCompute(`collections:list:${userId}`, async () => {
      const summary = await this.getCollectionSummary(userId);
      
      return [
        {
          id: 'recently-modified',
          name: 'Recently Modified',
          description: 'Files updated or modified within the last 7 days',
          endpoint: '/api/v1/collections/recently-modified',
          count: summary.collectionCounts.recentlyModified,
        },
        {
          id: 'shared-recently',
          name: 'Shared Recently',
          description: 'Files with active shares generated or used in the last 30 days',
          endpoint: '/api/v1/collections/shared-recently',
          count: summary.collectionCounts.sharedRecently,
        },
        {
          id: 'favorites',
          name: 'Favorites',
          description: 'Your pinned or starred files for quick access',
          endpoint: '/api/v1/collections/favorites',
          count: summary.collectionCounts.favorites,
        },
        {
          id: 'large-files',
          name: 'Large Files',
          description: 'Files consuming a significant portion of storage (>= 100 MB)',
          endpoint: '/api/v1/collections/large-files',
          count: summary.collectionCounts.largeFiles,
        },
        {
          id: 'needs-attention',
          name: 'Needs Attention',
          description: 'Files requiring security review or cleanup due to vulnerabilities or unsecured links',
          endpoint: '/api/v1/collections/needs-attention',
          count: summary.collectionCounts.needsAttention,
        },
      ];
    });
  }

  /**
   * RECENTLY MODIFIED: Retrieves files updated in the last N days (default 7)
   */
  public async getRecentlyModified(userId: string, days = 7): Promise<File[]> {
    return this.getCachedOrCompute(`collections:recent:${userId}:${days}`, async () => {
      const limitDate = new Date();
      limitDate.setDate(limitDate.getDate() - days);

      const { files } = await this.fileRepository.findAll(
        userId,
        { status: 'ACTIVE' },
        { page: 1, limit: 100000 },
        { sortBy: 'createdAt', sortOrder: 'desc' }
      );

      return files
        .filter((f) => f.updatedAt >= limitDate)
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    });
  }

  /**
   * SHARED RECENTLY: Retrieves files with active shares created/updated in the last M days (default 30)
   */
  public async getSharedRecently(userId: string, days = 30): Promise<SharedRecentlyItem[]> {
    return this.getCachedOrCompute(`collections:shared:${userId}:${days}`, async () => {
      const limitDate = new Date();
      limitDate.setDate(limitDate.getDate() - days);

      // Fetch all user shares
      const shares = await this.shareRepository.findAll(userId);
      const recentShares = shares.filter(
        (s) => s.shareStatus === 'ACTIVE' && s.updatedAt >= limitDate
      );

      // Group recent shares by file ID
      const fileShareGroups = new Map<string, typeof recentShares>();
      recentShares.forEach((s) => {
        const group = fileShareGroups.get(s.fileId) || [];
        group.push(s);
        fileShareGroups.set(s.fileId, group);
      });

      const sharedItems: SharedRecentlyItem[] = [];

      for (const [fileId, fileShares] of fileShareGroups.entries()) {
        const file = await this.fileRepository.findById(fileId);
        if (!file || file.status !== 'ACTIVE') continue;

        // Compute aggregations across ALL user shares for this file
        const allFileShares = shares.filter((s) => s.fileId === fileId);
        const totalDownloads = allFileShares.reduce((sum, s) => sum + s.downloadCount, 0);
        
        // Find last shared date from recent shares
        const lastSharedDate = fileShares.reduce((latest, s) => 
          s.createdAt > latest ? s.createdAt : latest, 
          fileShares[0].createdAt
        );

        sharedItems.push({
          id: file.id,
          fileName: file.fileName,
          fileSize: file.fileSize,
          fileType: file.fileType,
          securityScore: file.securityScore,
          shareCount: allFileShares.length,
          lastSharedDate,
          downloadCount: totalDownloads,
          createdAt: file.createdAt,
          updatedAt: file.updatedAt,
        });
      }

      // Sort by lastSharedDate descending
      return sharedItems.sort((a, b) => b.lastSharedDate.getTime() - a.lastSharedDate.getTime());
    });
  }

  /**
   * FAVORITES: Retrieves favorited files and recent favorite logs
   */
  public async getFavorites(userId: string): Promise<FavoritesCollection> {
    return this.getCachedOrCompute(`collections:favorites:${userId}`, async () => {
      const { files } = await this.fileRepository.findAll(
        userId,
        { favorite: true, status: 'ACTIVE' },
        { page: 1, limit: 100000 },
        { sortBy: 'createdAt', sortOrder: 'desc' }
      );

      // Fetch user's recent favorite activities
      const activities = await this.activityRepository.findRecent(userId, 200);
      const favoriteActivities = activities.filter(
        (a) => a.activityType === 'FILE_FAVORITED' || a.activityType === 'FILE_UNFAVORITED'
      ).slice(0, 10); // Keep top 10 recent actions

      return {
        files,
        favoriteCount: files.length,
        recentFavoriteActivity: favoriteActivities,
      };
    });
  }

  /**
   * LARGE FILES: Retrieves files matching or exceeding thresholdMb (default 100 MB)
   */
  public async getLargeFiles(userId: string, thresholdMb = 100): Promise<LargeFilesCollection> {
    return this.getCachedOrCompute(`collections:large:${userId}:${thresholdMb}`, async () => {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new NotFoundError('User profile not found');
      }

      const thresholdBytes = thresholdMb * 1024 * 1024;
      const { files } = await this.fileRepository.findAll(
        userId,
        { status: 'ACTIVE' },
        { page: 1, limit: 100000 },
        { sortBy: 'fileSize', sortOrder: 'desc' }
      );

      const largeFiles = files.filter((f) => f.fileSize >= thresholdBytes);
      const storageLimit = user.storageLimit || 5 * 1024 * 1024 * 1024;

      const mappedFiles: LargeFilesCollectionItem[] = largeFiles.map((f) => ({
        id: f.id,
        fileName: f.fileName,
        fileSize: f.fileSize,
        fileType: f.fileType,
        securityScore: f.securityScore,
        storageImpact: Number(((f.fileSize / storageLimit) * 100).toFixed(2)),
        createdAt: f.createdAt,
        updatedAt: f.updatedAt,
      }));

      const totalLargeFilesSize = largeFiles.reduce((sum, f) => sum + f.fileSize, 0);

      return {
        files: mappedFiles,
        totalLargeFilesCount: mappedFiles.length,
        totalLargeFilesSize,
        userStorageUsed: user.storageUsed || 0,
        userStorageLimit: storageLimit,
        thresholdMb,
      };
    });
  }

  /**
   * NEEDS ATTENTION: Evaluates files matching risk triggers
   */
  public async getNeedsAttention(userId: string): Promise<NeedsAttentionItem[]> {
    return this.getCachedOrCompute(`collections:needs-attention:${userId}`, async () => {
      const { files } = await this.fileRepository.findAll(
        userId,
        { status: 'ACTIVE' },
        { page: 1, limit: 100000 },
        { sortBy: 'createdAt', sortOrder: 'desc' }
      );

      const shares = await this.shareRepository.findAll(userId);
      const activeShares = shares.filter((s) => s.shareStatus === 'ACTIVE');
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const attentionItems: NeedsAttentionItem[] = [];

      for (const file of files) {
        const reasons: NeedsAttentionItem['reasons'] = [];

        // 1. Low Security Score
        if (file.securityScore < 70) {
          reasons.push('LOW_SECURITY_SCORE');
        }

        // Find active shares for this file
        const fileShares = activeShares.filter((s) => s.fileId === file.id);

        // 2. Unprotected Active Share (Public share without password and expiry)
        const hasUnprotected = fileShares.some((s) => !s.passwordProtected && !s.expiryDate);
        if (hasUnprotected) {
          reasons.push('UNPROTECTED_SHARE');
        }

        // 3. High Risk Share (No password lock, plus download count exceeding limit OR no expiry date OR executable file type)
        const hasHighRiskShare = fileShares.some((s) => 
          !s.passwordProtected && (
            !s.expiryDate || 
            (s.maxDownloads !== undefined && s.downloadCount >= s.maxDownloads) ||
            (['exe', 'bat', 'cmd', 'sh', 'msi'].includes(file.fileType) && file.securityScore < 50)
          )
        );
        if (hasHighRiskShare) {
          reasons.push('HIGH_RISK_SHARE');
        }

        // 4. Inactive File (unmodified for 30+ days and zero total download metrics)
        const fileTotalDownloads = shares
          .filter((s) => s.fileId === file.id)
          .reduce((sum, s) => sum + s.downloadCount, 0);

        if (file.updatedAt < thirtyDaysAgo && fileTotalDownloads === 0) {
          reasons.push('INACTIVE_FILE');
        }

        // 5. Executable Risk (Executable script files with low scores < 60)
        const isExecutableType = ['exe', 'bat', 'cmd', 'sh', 'msi'].includes(file.fileType);
        if (isExecutableType && file.securityScore < 60) {
          reasons.push('EXECUTABLE_RISK');
        }

        if (reasons.length > 0) {
          // De-duplicate reasons (e.g. UNPROTECTED_SHARE and HIGH_RISK_SHARE might both overlap)
          const uniqueReasons = Array.from(new Set(reasons)) as NeedsAttentionItem['reasons'];

          // Determine risk level based on reasons severity
          let riskLevel: NeedsAttentionItem['riskLevel'] = 'LOW';
          const hasHighIndicators = uniqueReasons.some(
            (r) => r === 'EXECUTABLE_RISK' || r === 'HIGH_RISK_SHARE'
          ) || file.securityScore < 50;

          const hasMediumIndicators = uniqueReasons.some(
            (r) => r === 'LOW_SECURITY_SCORE' || r === 'UNPROTECTED_SHARE'
          );

          if (hasHighIndicators) {
            riskLevel = 'HIGH';
          } else if (hasMediumIndicators) {
            riskLevel = 'MEDIUM';
          }

          attentionItems.push({
            file: {
              id: file.id,
              fileName: file.fileName,
              fileSize: file.fileSize,
              fileType: file.fileType,
              securityScore: file.securityScore,
              createdAt: file.createdAt,
              updatedAt: file.updatedAt,
            },
            reasons: uniqueReasons,
            riskLevel,
          });
        }
      }

      return attentionItems.sort((a, b) => {
        // Sort HIGH -> MEDIUM -> LOW
        const priority = { HIGH: 3, MEDIUM: 2, LOW: 1 };
        return priority[b.riskLevel] - priority[a.riskLevel];
      });
    });
  }

  /**
   * COLLECTION SUMMARY: Aggregates statistics, storage, metrics and security indicators
   */
  public async getCollectionSummary(userId: string): Promise<CollectionSummary> {
    return this.getCachedOrCompute(`collections:summary:${userId}`, async () => {
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
      const activeShares = shares.filter((s) => s.shareStatus === 'ACTIVE');

      // Fetch individual collections lengths and file instances
      const recentlyModifiedFiles = await this.getRecentlyModified(userId, 7);
      const sharedRecentlyItems = await this.getSharedRecently(userId, 30);
      const favoritesColl = await this.getFavorites(userId);
      const largeFilesColl = await this.getLargeFiles(userId, 100);
      const needsAttentionItems = await this.getNeedsAttention(userId);

      // Map corresponding files for calculations
      const recentlyModifiedBytes = recentlyModifiedFiles.reduce((sum, f) => sum + f.fileSize, 0);
      
      const sharedRecentlyFileIds = new Set(sharedRecentlyItems.map((item) => item.id));
      const sharedRecentlyBytes = files
        .filter((f) => sharedRecentlyFileIds.has(f.id))
        .reduce((sum, f) => sum + f.fileSize, 0);

      const favoritesBytes = favoritesColl.files.reduce((sum, f) => sum + f.fileSize, 0);
      const largeFilesBytes = largeFilesColl.totalLargeFilesSize;
      
      const needsAttentionFileIds = new Set(needsAttentionItems.map((item) => item.file.id));
      const needsAttentionBytes = files
        .filter((f) => needsAttentionFileIds.has(f.id))
        .reduce((sum, f) => sum + f.fileSize, 0);

      const totalFiles = files.length;
      const totalStorageUsed = user.storageUsed || 0;

      const largeFilesRatio = totalStorageUsed > 0 ? Number((largeFilesBytes / totalStorageUsed).toFixed(4)) : 0;
      const needsAttentionRatio = totalFiles > 0 ? Number((needsAttentionItems.length / totalFiles).toFixed(4)) : 0;

      // Health indicators
      const averageSecurityScore =
        totalFiles > 0
          ? Math.round(files.reduce((sum, f) => sum + f.securityScore, 0) / totalFiles)
          : 100;

      const unsecuredShareCount = activeShares.filter((s) => !s.passwordProtected).length;
      const cleanFilesCount = files.filter((f) => f.securityScore >= 80).length;

      return {
        collectionCounts: {
          recentlyModified: recentlyModifiedFiles.length,
          sharedRecently: sharedRecentlyItems.length,
          favorites: favoritesColl.files.length,
          largeFiles: largeFilesColl.files.length,
          needsAttention: needsAttentionItems.length,
        },
        storageConsumption: {
          recentlyModifiedBytes,
          sharedRecentlyBytes,
          favoritesBytes,
          largeFilesBytes,
          needsAttentionBytes,
        },
        collectionMetrics: {
          totalFiles,
          totalStorageUsed,
          largeFilesRatio,
          needsAttentionRatio,
        },
        healthIndicators: {
          averageSecurityScore,
          unsecuredShareCount,
          cleanFilesCount,
        },
      };
    });
  }

  // =======================================================
  // AI PREPARATION MOCK METHODS (Future Collaborative AI)
  // =======================================================

  /**
   * Future AI recommendations placeholder. Returns mock records based on current files.
   */
  public async getAIRecommendations(userId: string): Promise<AIRecommendedFile[]> {
    const { files } = await this.fileRepository.findAll(
      userId,
      { status: 'ACTIVE' },
      { page: 1, limit: 5 },
      { sortBy: 'createdAt', sortOrder: 'desc' }
    );

    if (files.length === 0) return [];

    const mockReasons = [
      'Frequently accessed in your team around this time.',
      'Colleague recently modified a related workspace file.',
      'Identified as a high-priority document for your project.',
      'Commonly opened after logging in from your location.',
      'Shared with team members working on the same files.',
    ];

    return files.map((file, idx) => ({
      fileId: file.id,
      fileName: file.fileName,
      recommendationReason: mockReasons[idx % mockReasons.length],
      confidenceScore: Number((0.95 - idx * 0.05).toFixed(2)),
      recommendedAt: new Date(),
    }));
  }

  /**
   * Future Frequently Accessed AI collection.
   */
  public async getFrequentlyAccessed(userId: string): Promise<FrequentlyAccessedFile[]> {
    const { files } = await this.fileRepository.findAll(
      userId,
      { status: 'ACTIVE' },
      { page: 1, limit: 5 },
      { sortBy: 'createdAt', sortOrder: 'desc' }
    );

    return files.map((file, idx) => ({
      fileId: file.id,
      fileName: file.fileName,
      accessCount: 42 - idx * 5,
      lastAccessTime: new Date(Date.now() - idx * 2 * 60 * 60 * 1000),
    }));
  }

  /**
   * Future Archive Candidates AI suggestions.
   */
  public async getArchiveCandidates(userId: string): Promise<ArchiveCandidate[]> {
    const { files } = await this.fileRepository.findAll(
      userId,
      { status: 'ACTIVE' },
      { page: 1, limit: 3 },
      { sortBy: 'fileSize', sortOrder: 'desc' }
    );

    return files.map((file, idx) => ({
      fileId: file.id,
      fileName: file.fileName,
      lastAccessedAt: new Date(Date.now() - (90 + idx * 10) * 24 * 60 * 60 * 1000),
      estimatedStorageSavings: file.fileSize,
      archivalReason: `Unused for ${90 + idx * 10} days. Estimated storage impact is high.`,
    }));
  }

  /**
   * Future Security Risks AI analytics.
   */
  public async getSecurityRisks(userId: string): Promise<SecurityRiskCandidate[]> {
    const { files } = await this.fileRepository.findAll(
      userId,
      { status: 'ACTIVE' },
      { page: 1, limit: 3 },
      { sortBy: 'securityScore', sortOrder: 'asc' }
    );

    return files
      .filter((file) => file.securityScore < 70)
      .map((file) => ({
        fileId: file.id,
        fileName: file.fileName,
        riskType: file.securityScore < 50 ? 'CRITICAL_VULNERABILITY' : 'LOW_HEALTH_SCORE',
        riskScore: 100 - file.securityScore,
      }));
  }

  /**
   * Future Team Hot Files collaborative intelligence.
   */
  public async getTeamHotFiles(userId: string): Promise<TeamHotFile[]> {
    const { files } = await this.fileRepository.findAll(
      userId,
      { status: 'ACTIVE' },
      { page: 1, limit: 3 },
      { sortBy: 'createdAt', sortOrder: 'desc' }
    );

    return files.map((file, idx) => ({
      fileId: file.id,
      fileName: file.fileName,
      activityVelocity: Number((15.4 - idx * 2.1).toFixed(1)),
      departmentId: 'dept-engineering',
    }));
  }
}
