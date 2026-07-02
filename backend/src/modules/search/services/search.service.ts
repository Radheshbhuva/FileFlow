import { FileRepository, File } from '../../files/interfaces/file.interface';
import { ShareRepository } from '../../shares/interfaces/share.interface';
import { UserRepository } from '../../auth/interfaces/user.interface';
import { CollectionService } from '../../collections/services/collection.service';
import { SearchHistoryRepository } from '../../database/interfaces/search-history.interface';
import { RepositoryRegistry } from '../../database/repositories/registry';
import {
  SearchQueryOptions,
  SearchSuggestionsResult,
  DiscoveryResults,
  SearchAnalyticsSummary,
  VectorSearchEngine,
  SearchIndexEngine,
  VectorQuery,
  VectorSearchResult
} from '../interfaces/search.interface';
import { NotFoundError } from '../../../utils/app-error';

export class SearchService implements VectorSearchEngine, SearchIndexEngine {
  private fileRepository: FileRepository;
  private shareRepository: ShareRepository;
  private userRepository: UserRepository;
  private collectionService: CollectionService;
  private searchHistoryRepository: SearchHistoryRepository;

  constructor(
    fileRepository: FileRepository = RepositoryRegistry.getFileRepository(),
    shareRepository: ShareRepository = RepositoryRegistry.getShareRepository(),
    userRepository: UserRepository = RepositoryRegistry.getUserRepository(),
    collectionService: CollectionService = new CollectionService(),
    searchHistoryRepository: SearchHistoryRepository = RepositoryRegistry.getSearchHistoryRepository()
  ) {
    this.fileRepository = fileRepository;
    this.shareRepository = shareRepository;
    this.userRepository = userRepository;
    this.collectionService = collectionService;
    this.searchHistoryRepository = searchHistoryRepository;
  }

  /**
   * Helper to calculate matching score for string query on filename.
   * Exact match = 1000. Prefix = 500+. Infix/Suffix = 100+. No match = 0.
   * Keyword density/length penalty is applied.
   */
  private calculateRelevanceScore(fileName: string, query: string): number {
    const name = fileName.toLowerCase();
    const q = query.trim().toLowerCase();

    if (!q) return 0;
    if (name === q) return 1000;

    if (name.startsWith(q)) {
      return 500 + (100 / (name.length - q.length + 1));
    }

    const index = name.indexOf(q);
    if (index !== -1) {
      return 100 + (50 / (index + 1)) + (50 / (name.length - q.length + 1));
    }

    return 0;
  }

  /**
   * Helper to fetch file list based on target Smart Collection
   */
  private async getFilesByCollection(userId: string, collectionType: string): Promise<File[]> {
    switch (collectionType) {
      case 'recently-modified':
        return this.collectionService.getRecentlyModified(userId);
      case 'shared-recently': {
        const shared = await this.collectionService.getSharedRecently(userId);
        const files: File[] = [];
        for (const s of shared) {
          const file = await this.fileRepository.findById(s.id);
          if (file && file.status !== 'DELETED') {
            files.push(file);
          }
        }
        return files;
      }
      case 'favorites': {
        const favorites = await this.collectionService.getFavorites(userId);
        return favorites.files;
      }
      case 'large-files': {
        const large = await this.collectionService.getLargeFiles(userId);
        const files: File[] = [];
        for (const item of large.files) {
          const file = await this.fileRepository.findById(item.id);
          if (file && file.status !== 'DELETED') {
            files.push(file);
          }
        }
        return files;
      }
      case 'needs-attention': {
        const attention = await this.collectionService.getNeedsAttention(userId);
        const files: File[] = [];
        for (const item of attention) {
          const file = await this.fileRepository.findById(item.file.id);
          if (file && file.status !== 'DELETED') {
            files.push(file);
          }
        }
        return files;
      }
      default:
        return [];
    }
  }

  /**
   * Global Search: Filters and sorts files dynamically with custom heuristics.
   */
  public async searchFiles(
    userId: string,
    options: SearchQueryOptions
  ): Promise<{ files: File[]; total: number; page: number; limit: number }> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User profile not found');
    }

    // 1. Fetch initial set of candidate files
    let candidateFiles: File[] = [];
    const filters = options.filters || {};

    if (filters.collectionType) {
      candidateFiles = await this.getFilesByCollection(userId, filters.collectionType);
    } else {
      const { files } = await this.fileRepository.findAll(
        userId,
        {},
        { page: 1, limit: 100000 },
        { sortBy: 'createdAt', sortOrder: 'desc' }
      );
      candidateFiles = files;
    }

    // Ensure we exclude deleted files
    candidateFiles = candidateFiles.filter((f) => f.status !== 'DELETED');

    // 2. Preload active share logs to calculate share count and downloads efficiently
    const userShares = await this.shareRepository.findAll(userId);
    const fileShareCountMap = new Map<string, number>();
    const fileDownloadMap = new Map<string, number>();

    userShares.forEach((s) => {
      if (s.shareStatus === 'ACTIVE') {
        const currentShares = fileShareCountMap.get(s.fileId) || 0;
        fileShareCountMap.set(s.fileId, currentShares + 1);
      }
      const currentDownloads = fileDownloadMap.get(s.fileId) || 0;
      fileDownloadMap.set(s.fileId, currentDownloads + s.downloadCount);
    });

    // 3. Track search text if query is present
    const rawQuery = options.query?.trim() || '';
    if (rawQuery) {
      await this.searchHistoryRepository.recordSearch(userId, rawQuery);
    }

    // 4. Apply advanced query filters and relevance calculation
    const relevanceScores = new Map<string, number>();

    let filtered = candidateFiles.filter((file) => {
      // Query keyword match
      if (rawQuery) {
        const relevance = this.calculateRelevanceScore(file.fileName, rawQuery);
        const matchesFileType = file.fileType.toLowerCase().includes(rawQuery.toLowerCase());
        const matchesStatus = file.status.toLowerCase().includes(rawQuery.toLowerCase());
        const matchesShareStatus = file.shareStatus.toLowerCase().includes(rawQuery.toLowerCase());

        // Standard user name check for owner keyword search
        const matchesOwner = user.fullName.toLowerCase().includes(rawQuery.toLowerCase()) || 
                             user.email.toLowerCase().includes(rawQuery.toLowerCase());

        const isMatch = relevance > 0 || matchesFileType || matchesStatus || matchesShareStatus || matchesOwner;

        if (!isMatch) {
          return false;
        }

        relevanceScores.set(file.id, relevance);
      }

      // Advanced filters
      if (filters.fileType && file.fileType.toLowerCase() !== filters.fileType.toLowerCase()) {
        return false;
      }

      if (filters.startDate && file.createdAt < filters.startDate) {
        return false;
      }

      if (filters.endDate && file.createdAt > filters.endDate) {
        return false;
      }

      if (filters.minSize !== undefined && file.fileSize < filters.minSize) {
        return false;
      }

      if (filters.maxSize !== undefined && file.fileSize > filters.maxSize) {
        return false;
      }

      if (filters.favorite !== undefined && file.favorite !== filters.favorite) {
        return false;
      }

      if (filters.shareStatus && file.shareStatus !== filters.shareStatus) {
        return false;
      }

      if (filters.minSecurityScore !== undefined && file.securityScore < filters.minSecurityScore) {
        return false;
      }

      if (filters.maxSecurityScore !== undefined && file.securityScore > filters.maxSecurityScore) {
        return false;
      }

      if (filters.owner) {
        const ownerQuery = filters.owner.toLowerCase();
        const matchesOwner = user.fullName.toLowerCase().includes(ownerQuery) || 
                             user.email.toLowerCase().includes(ownerQuery) || 
                             file.ownerId === filters.owner;
        if (!matchesOwner) return false;
      }

      return true;
    });

    // Log failed searches (returning 0 records)
    if (rawQuery && filtered.length === 0) {
      await this.searchHistoryRepository.recordFailedSearch(userId, rawQuery, 'No matching files found');
    }

    // 5. Apply sorting heuristics
    const sortField = options.sort?.field || 'relevance';
    const sortOrder = options.sort?.order || 'desc';

    filtered.sort((a, b) => {
      let valA: any;
      let valB: any;

      switch (sortField) {
        case 'relevance':
          valA = relevanceScores.get(a.id) || 0;
          valB = relevanceScores.get(b.id) || 0;
          // Fall back to createdAt descending if score is identical
          if (valA === valB) {
            valA = a.createdAt.getTime();
            valB = b.createdAt.getTime();
            return valB - valA; // Descending
          }
          break;
        case 'recently_modified':
          valA = a.updatedAt.getTime();
          valB = b.updatedAt.getTime();
          break;
        case 'recently_uploaded':
          valA = a.createdAt.getTime();
          valB = b.createdAt.getTime();
          break;
        case 'file_size':
          valA = a.fileSize;
          valB = b.fileSize;
          break;
        case 'most_shared':
          valA = fileShareCountMap.get(a.id) || 0;
          valB = fileShareCountMap.get(b.id) || 0;
          break;
        case 'most_downloaded':
          valA = fileDownloadMap.get(a.id) || 0;
          valB = fileDownloadMap.get(b.id) || 0;
          break;
        case 'alphabetical':
          valA = a.fileName.toLowerCase();
          valB = b.fileName.toLowerCase();
          if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
          if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
          return 0;
        default:
          valA = a.createdAt.getTime();
          valB = b.createdAt.getTime();
          break;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    // 6. Pagination
    const page = options.page || 1;
    const limit = options.limit || 10;
    const total = filtered.length;
    const startIndex = (page - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + limit);

    return {
      files: paginated,
      total,
      page,
      limit,
    };
  }

  /**
   * Search Suggestions: Return history searches, suggestions, and matched virtual collections
   */
  public async getSuggestions(userId: string, partialQuery = ''): Promise<SearchSuggestionsResult> {
    const q = partialQuery.trim().toLowerCase();

    // 1. Recent logged user searches
    const recentSearches = await this.searchHistoryRepository.getRecent(userId, 5);

    // 2. Global popular searches
    const popularSearches = await this.searchHistoryRepository.getPopular(5);

    // 3. Match user files matching query string prefix
    const { files } = await this.fileRepository.findAll(
      userId,
      { status: 'ACTIVE' },
      { page: 1, limit: 10000 },
      { sortBy: 'createdAt', sortOrder: 'desc' }
    );

    let suggestedFiles: File[] = [];
    if (q) {
      suggestedFiles = files
        .filter((f) => f.fileName.toLowerCase().startsWith(q))
        .sort((a, b) => this.calculateRelevanceScore(b.fileName, q) - this.calculateRelevanceScore(a.fileName, q))
        .slice(0, 5);
    } else {
      // default: recommend recent 5 files
      suggestedFiles = files.slice(0, 5);
    }

    // 4. Retrieve matched Smart Collections metadata
    const collections = await this.collectionService.getCollectionsList(userId);
    const suggestedCollections = q
      ? collections.filter(
          (c) => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
        )
      : collections;

    return {
      recentSearches,
      popularSearches,
      suggestedFiles,
      suggestedCollections,
    };
  }

  /**
   * Recent searches getter
   */
  public async getRecentSearches(userId: string): Promise<string[]> {
    return this.searchHistoryRepository.getRecent(userId, 10);
  }

  /**
   * Track searches explicitly
   */
  public async trackSearch(userId: string, query: string): Promise<void> {
    if (query?.trim()) {
      await this.searchHistoryRepository.recordSearch(userId, query);
    }
  }

  /**
   * Discovery Feed Engine: Aggregates files sorted/grouped by modern criteria
   */
  public async getDiscoveryResults(userId: string): Promise<DiscoveryResults> {
    // 1. Recently Modified files (capped at 5)
    const recentlyModified = (await this.collectionService.getRecentlyModified(userId)).slice(0, 5);

    // 2. Favorites collection files (capped at 5)
    const favoritesCollection = await this.collectionService.getFavorites(userId);
    const favorites = favoritesCollection.files.slice(0, 5);

    // 3. Large files (capped at 5)
    const largeFilesCollection = await this.collectionService.getLargeFiles(userId);
    const largeFiles = largeFilesCollection.files
      .map((item) => {
        const file = (this.fileRepository as any).files?.find((f: any) => f.id === item.id);
        return file ? { ...file } : null;
      })
      .filter((f): f is File => f !== null)
      .slice(0, 5);

    // 4. Needs Attention collection files (capped at 5)
    const attentionCollection = await this.collectionService.getNeedsAttention(userId);
    const needsAttention: File[] = [];
    for (const item of attentionCollection) {
      if (needsAttention.length >= 5) break;
      const file = await this.fileRepository.findById(item.file.id);
      if (file && file.status !== 'DELETED') {
        needsAttention.push(file);
      }
    }

    // 5. Frequently accessed files (highest download counts)
    const userShares = await this.shareRepository.findAll(userId);
    const fileDownloadMap = new Map<string, number>();
    userShares.forEach((s) => {
      const current = fileDownloadMap.get(s.fileId) || 0;
      fileDownloadMap.set(s.fileId, current + s.downloadCount);
    });

    const sortedAccessIds = Array.from(fileDownloadMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => id);

    const frequentlyAccessed: File[] = [];
    for (const fileId of sortedAccessIds) {
      if (frequentlyAccessed.length >= 5) break;
      const file = await this.fileRepository.findById(fileId);
      if (file && file.status === 'ACTIVE') {
        frequentlyAccessed.push(file);
      }
    }

    // 6. Recently Shared files
    const sortedShared = userShares
      .filter((s) => s.shareStatus === 'ACTIVE')
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

    const recentlySharedIds = Array.from(new Set(sortedShared.map((s) => s.fileId)));
    const recentlyShared: File[] = [];
    for (const fileId of recentlySharedIds) {
      if (recentlyShared.length >= 5) break;
      const file = await this.fileRepository.findById(fileId);
      if (file && file.status === 'ACTIVE') {
        recentlyShared.push(file);
      }
    }

    return {
      recentlyModified,
      frequentlyAccessed,
      recentlyShared,
      favorites,
      largeFiles,
      needsAttention,
    };
  }

  /**
   * Trending: Group files by most accessed, most shared, most downloaded, and most favorited
   */
  public async getTrendingFiles(
    userId: string
  ): Promise<{
    mostAccessed: File[];
    mostShared: File[];
    mostDownloaded: File[];
    mostFavorited: File[];
  }> {
    const userShares = await this.shareRepository.findAll(userId);
    const fileShareCountMap = new Map<string, number>();
    const fileDownloadMap = new Map<string, number>();

    userShares.forEach((s) => {
      if (s.shareStatus === 'ACTIVE') {
        const count = fileShareCountMap.get(s.fileId) || 0;
        fileShareCountMap.set(s.fileId, count + 1);
      }
      const count = fileDownloadMap.get(s.fileId) || 0;
      fileDownloadMap.set(s.fileId, count + s.downloadCount);
    });

    const { files } = await this.fileRepository.findAll(
      userId,
      { status: 'ACTIVE' },
      { page: 1, limit: 100000 },
      { sortBy: 'createdAt', sortOrder: 'desc' }
    );

    // 1. Most Accessed / Most Downloaded (same downloadCount metrics)
    const sortedByDownloads = [...files]
      .sort((a, b) => (fileDownloadMap.get(b.id) || 0) - (fileDownloadMap.get(a.id) || 0))
      .slice(0, 5);

    // 2. Most Shared
    const sortedByShares = [...files]
      .sort((a, b) => (fileShareCountMap.get(b.id) || 0) - (fileShareCountMap.get(a.id) || 0))
      .slice(0, 5);

    // 3. Most Favorited
    const mostFavorited = files.filter((f) => f.favorite).slice(0, 5);

    return {
      mostAccessed: sortedByDownloads,
      mostShared: sortedByShares,
      mostDownloaded: sortedByDownloads,
      mostFavorited,
    };
  }

  /**
   * Get search analytics summary
   */
  public async getSearchAnalytics(userId?: string): Promise<SearchAnalyticsSummary> {
    const records = await this.searchHistoryRepository.getAllHistory(userId);
    const failed = await this.searchHistoryRepository.getFailedSearches(userId);

    const totalSearches = records.reduce((sum, r) => sum + r.frequency, 0);

    const searchFrequency: Record<string, number> = {};
    records.forEach((r) => {
      searchFrequency[r.query] = r.frequency;
    });

    const topQueries = records
      .map((r) => ({ query: r.query, frequency: r.frequency }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);

    // Group trends by date
    const dateMap = new Map<string, number>();
    records.forEach((r) => {
      const dateStr = r.lastSearchedAt.toISOString().split('T')[0];
      const count = dateMap.get(dateStr) || 0;
      dateMap.set(dateStr, count + r.frequency);
    });

    const searchTrends = Array.from(dateMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalSearches,
      searchFrequency,
      topQueries,
      failedSearches: failed,
      searchTrends,
    };
  }

  // =========================================================================
  // VectorSearchEngine & SearchIndexEngine Implementation (AI/AWS Ready Placeholders)
  // =========================================================================

  public async upsertVector(
    id: string,
    vector: number[],
    metadata: Record<string, any>
  ): Promise<void> {
    // AWS/AI Placeholder: Upserts embed vectors into a vector db (Pinecone, AWS OpenSearch vector search index, pgvector).
    // e.g. await this.pineconeClient.upsert('files', [{ id, values: vector, metadata }]);
  }

  public async queryVector(query: VectorQuery): Promise<Array<VectorSearchResult<any>>> {
    // AWS/AI Placeholder: Queries vector db using cosine similarity.
    // e.g. return await this.pineconeClient.query('files', { vector: query.vector, topK: query.topK });
    return [];
  }

  public async deleteVector(id: string): Promise<void> {
    // AWS/AI Placeholder: Deletes entry from vector index.
  }

  public async indexDocument(index: string, id: string, doc: Record<string, any>): Promise<void> {
    // AWS OpenSearch/Elasticsearch Placeholder: Indexes structural file parameters for full-text search.
    // e.g. await this.openSearchClient.index({ index, id, body: doc });
  }

  public async updateDocument(
    index: string,
    id: string,
    doc: Partial<Record<string, any>>
  ): Promise<void> {
    // AWS OpenSearch/Elasticsearch Placeholder: Updates index document parameters.
  }

  public async deleteDocument(index: string, id: string): Promise<void> {
    // AWS OpenSearch/Elasticsearch Placeholder: Deletes document from indices.
  }

  public async searchIndex(index: string, dslQuery: Record<string, any>): Promise<any> {
    // AWS OpenSearch/Elasticsearch Placeholder: Complex querying using Query DSL syntax.
    return { hits: { total: { value: 0 }, hits: [] } };
  }
}
