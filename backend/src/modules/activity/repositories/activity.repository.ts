import { Activity, ActivityRepository, ListActivityFilters, ListActivityPagination } from '../interfaces/activity.interface';
import { v4 as uuidv4 } from 'uuid';

export class InMemoryActivityRepository implements ActivityRepository {
  private activities: Activity[] = [];
  private static instance: InMemoryActivityRepository;

  private constructor() {}

  public static getInstance(): InMemoryActivityRepository {
    if (!InMemoryActivityRepository.instance) {
      InMemoryActivityRepository.instance = new InMemoryActivityRepository();
    }
    return InMemoryActivityRepository.instance;
  }

  public clear(): void {
    this.activities = [];
  }

  public async create(activityData: Omit<Activity, 'id' | 'createdAt'>): Promise<Activity> {
    const now = new Date();
    const newActivity: Activity = {
      ...activityData,
      id: uuidv4(),
      createdAt: now,
    };
    this.activities.push(newActivity);
    return { ...newActivity };
  }

  public async findById(id: string): Promise<Activity | null> {
    const activity = this.activities.find((a) => a.id === id);
    return activity ? { ...activity } : null;
  }

  public async findAll(
    filters: ListActivityFilters,
    pagination: ListActivityPagination
  ): Promise<{ activities: Activity[]; total: number }> {
    let results = [...this.activities];

    if (filters.userId) {
      results = results.filter((a) => a.userId === filters.userId);
    }

    if (filters.activityType) {
      results = results.filter((a) => a.activityType === filters.activityType);
    }

    if (filters.severity) {
      results = results.filter((a) => a.severity === filters.severity);
    }

    if (filters.resourceType) {
      results = results.filter((a) => a.resourceType?.toLowerCase() === filters.resourceType?.toLowerCase());
    }

    if (filters.startDate) {
      const start = new Date(filters.startDate);
      results = results.filter((a) => a.createdAt >= start);
    }

    if (filters.endDate) {
      const end = new Date(filters.endDate);
      results = results.filter((a) => a.createdAt <= end);
    }

    if (filters.search) {
      const q = filters.search.toLowerCase();
      results = results.filter(
        (a) =>
          a.description.toLowerCase().includes(q) ||
          (a.resourceName && a.resourceName.toLowerCase().includes(q))
      );
    }

    // Sort chronologically descending (newest first)
    results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = results.length;
    const { page, limit } = pagination;
    const startIndex = (page - 1) * limit;
    const paginatedResults = results.slice(startIndex, startIndex + limit);

    return {
      activities: paginatedResults.map((a) => ({ ...a })),
      total,
    };
  }

  public async findRecent(userId?: string, limit = 10): Promise<Activity[]> {
    let results = [...this.activities];
    if (userId) {
      results = results.filter((a) => a.userId === userId);
    }
    
    // Sort chronologically descending
    results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return results.slice(0, limit).map((a) => ({ ...a }));
  }

  public async getSummary(userId?: string): Promise<{
    totalActivities: number;
    uploads: number;
    shares: number;
    downloads: number;
    profileChanges: number;
    recentActivityCount: number;
  }> {
    let results = [...this.activities];
    if (userId) {
      results = results.filter((a) => a.userId === userId);
    }

    const totalActivities = results.length;
    const uploads = results.filter((a) => a.activityType === 'FILE_UPLOADED').length;
    const shares = results.filter((a) => a.activityType === 'SHARE_CREATED' || a.activityType === 'FILE_SHARED').length;
    const downloads = results.filter((a) => a.activityType === 'SHARE_DOWNLOADED').length;
    const profileChanges = results.filter((a) => a.activityType === 'PROFILE_UPDATED' || a.activityType === 'PASSWORD_CHANGED').length;

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentActivityCount = results.filter((a) => a.createdAt >= sevenDaysAgo).length;

    return {
      totalActivities,
      uploads,
      shares,
      downloads,
      profileChanges,
      recentActivityCount,
    };
  }
}
