import { Activity, ActivityRepository, ListActivityFilters } from '../interfaces/activity.interface';
import { RepositoryRegistry } from '../../database/repositories/registry';
import { NotFoundError, ForbiddenError } from '../../../utils/app-error';
import { eventBusService } from '../../realtime/services/event-bus.service';
import { logger } from '../../../config/logger';

export class ActivityService {
  private activityRepository: ActivityRepository;

  constructor(activityRepository: ActivityRepository = RepositoryRegistry.getActivityRepository()) {
    this.activityRepository = activityRepository;
  }

  /**
   * Log an activity directly in the repository
   */
  public async createActivity(dto: Omit<Activity, 'id' | 'createdAt'>): Promise<Activity> {
    const activity = await this.activityRepository.create(dto);

    if (activity.userId) {
      try {
        const workspaceRepo = RepositoryRegistry.getWorkspaceRepository();
        const workspaces = await workspaceRepo.findByOwnerId(activity.userId);
        const workspaceId = workspaces.length > 0 ? workspaces[0].id : activity.userId;

        eventBusService.publishEvent({
          eventType: 'ACTIVITY_CREATED',
          workspaceId,
          userId: activity.userId,
          payload: activity,
        }).catch((err) => logger.error('Failed to publish real-time activity event:', err));
      } catch (err) {
        logger.error('Failed to resolve workspace for real-time activity event:', err);
      }
    }

    return activity;
  }

  /**
   * List paginated activity feed for a user or system
   */
  public async listActivities(
    userId: string,
    query: any
  ): Promise<{ activities: Activity[]; total: number; page: number; limit: number }> {
    const page = query.page || 1;
    const limit = query.limit || 10;

    const filters: ListActivityFilters = {
      userId, // Confine standard users to their own logs
    };

    if (query.activityType) filters.activityType = query.activityType;
    if (query.severity) filters.severity = query.severity;
    if (query.resourceType) filters.resourceType = query.resourceType;
    if (query.startDate) filters.startDate = new Date(query.startDate);
    if (query.endDate) filters.endDate = new Date(query.endDate);
    if (query.search) filters.search = query.search;

    const { activities, total } = await this.activityRepository.findAll(filters, { page, limit });

    return { activities, total, page, limit };
  }

  /**
   * Fetch details of a single activity, validating access
   */
  public async getActivity(userId: string, id: string): Promise<Activity> {
    const activity = await this.activityRepository.findById(id);
    if (!activity) {
      throw new NotFoundError('Activity record not found');
    }

    // Verify ownership boundary
    if (activity.userId && activity.userId !== userId) {
      throw new ForbiddenError('You do not have permission to view this activity log');
    }

    return activity;
  }

  /**
   * Fetch recent activities for dashboard view
   */
  public async getRecentActivities(userId: string, limit?: number): Promise<Activity[]> {
    return this.activityRepository.findRecent(userId, limit);
  }

  /**
   * Retrieve aggregated activity counts
   */
  public async getActivitySummary(userId: string): Promise<{
    totalActivities: number;
    uploads: number;
    shares: number;
    downloads: number;
    profileChanges: number;
    recentActivityCount: number;
  }> {
    return this.activityRepository.getSummary(userId);
  }
}
