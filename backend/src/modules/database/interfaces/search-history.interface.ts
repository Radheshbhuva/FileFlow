import { SearchHistoryRecord } from '../../search/interfaces/search.interface';

export interface SearchHistoryRepository {
  recordSearch(userId: string, query: string): Promise<SearchHistoryRecord>;
  recordFailedSearch(userId: string, query: string, reason: string): Promise<void>;
  getRecent(userId: string, limit?: number): Promise<string[]>;
  getPopular(limit?: number): Promise<Array<{ query: string; frequency: number }>>;
  getFailedSearches(userId?: string): Promise<Array<{ query: string; reason: string; timestamp: Date }>>;
  getAllHistory(userId?: string): Promise<SearchHistoryRecord[]>;
}
