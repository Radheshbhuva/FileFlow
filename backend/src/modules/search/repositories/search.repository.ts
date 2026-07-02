import { SearchHistoryRecord } from '../interfaces/search.interface';
import { v4 as uuidv4 } from 'uuid';

export class InMemorySearchHistoryRepository {
  private history: SearchHistoryRecord[] = [];
  private failedSearches: Array<{ query: string; reason: string; timestamp: Date; userId: string }> = [];
  private static instance: InMemorySearchHistoryRepository;

  private constructor() {}

  public static getInstance(): InMemorySearchHistoryRepository {
    if (!InMemorySearchHistoryRepository.instance) {
      InMemorySearchHistoryRepository.instance = new InMemorySearchHistoryRepository();
    }
    return InMemorySearchHistoryRepository.instance;
  }

  public clear(): void {
    this.history = [];
    this.failedSearches = [];
  }

  public async recordSearch(userId: string, query: string): Promise<SearchHistoryRecord> {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      throw new Error('Query cannot be empty');
    }

    const existingIndex = this.history.findIndex(
      (h) => h.userId === userId && h.query.toLowerCase() === normalizedQuery
    );

    const now = new Date();
    if (existingIndex !== -1) {
      const record = this.history[existingIndex];
      record.frequency += 1;
      record.lastSearchedAt = now;
      this.history[existingIndex] = record;
      return { ...record };
    } else {
      const newRecord: SearchHistoryRecord = {
        id: uuidv4(),
        userId,
        query: query.trim(),
        frequency: 1,
        lastSearchedAt: now,
        createdAt: now,
      };
      this.history.push(newRecord);
      return { ...newRecord };
    }
  }

  public async recordFailedSearch(userId: string, query: string, reason: string): Promise<void> {
    this.failedSearches.push({
      userId,
      query: query.trim(),
      reason,
      timestamp: new Date(),
    });
  }

  public async getRecent(userId: string, limit = 5): Promise<string[]> {
    return this.history
      .filter((h) => h.userId === userId)
      .sort((a, b) => b.lastSearchedAt.getTime() - a.lastSearchedAt.getTime())
      .slice(0, limit)
      .map((h) => h.query);
  }

  public async getPopular(limit = 5): Promise<Array<{ query: string; frequency: number }>> {
    const queryMap = new Map<string, number>();
    this.history.forEach((h) => {
      const key = h.query.trim();
      const current = queryMap.get(key) || 0;
      queryMap.set(key, current + h.frequency);
    });

    return Array.from(queryMap.entries())
      .map(([query, frequency]) => ({ query, frequency }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, limit);
  }

  public async getFailedSearches(userId?: string): Promise<Array<{ query: string; reason: string; timestamp: Date }>> {
    let list = this.failedSearches;
    if (userId) {
      list = list.filter((f) => f.userId === userId);
    }
    return list.map((f) => ({ query: f.query, reason: f.reason, timestamp: f.timestamp }));
  }

  public async getAllHistory(userId?: string): Promise<SearchHistoryRecord[]> {
    let list = this.history;
    if (userId) {
      list = list.filter((h) => h.userId === userId);
    }
    return list.map((h) => ({ ...h }));
  }
}
