import { UserRepository, User } from '../../auth/interfaces/user.interface';
import { RepositoryRegistry } from '../../database/repositories/registry';
import { PasswordService } from '../../auth/services/password.service';
import { UnauthorizedError, NotFoundError } from '../../../utils/app-error';
import { eventBus } from '../../../shared/event-bus';

export class UserService {
  private userRepository: UserRepository;

  constructor(userRepository: UserRepository = RepositoryRegistry.getUserRepository()) {
    this.userRepository = userRepository;
  }

  /**
   * Updates standard profile parameters
   */
  public async updateProfile(userId: string, updates: any): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User profile not found');
    }

    const allowedUpdates = ['fullName', 'avatar', 'timezone', 'company', 'jobTitle'];
    const filteredUpdates: Partial<User> = {};

    for (const key of allowedUpdates) {
      if (updates[key] !== undefined) {
        filteredUpdates[key as keyof User] = updates[key];
      }
    }

    const updatedUser = await this.userRepository.update(userId, filteredUpdates);

    eventBus.emit('user.profile_updated', { userId });

    const { passwordHash: _, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  /**
   * Updates user avatar URL
   */
  public async updateAvatar(userId: string, avatarUrl: string): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User profile not found');
    }

    const updatedUser = await this.userRepository.update(userId, { avatar: avatarUrl });
    const { passwordHash: _, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  /**
   * Changes the user's password securely after verifying the current credential hash
   */
  public async changePassword(userId: string, dto: any): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User profile not found');
    }

    const isCurrentMatch = await PasswordService.compare(dto.currentPassword, user.passwordHash);
    if (!isCurrentMatch) {
      throw new UnauthorizedError('Incorrect current password');
    }

    const newPasswordHash = await PasswordService.hash(dto.newPassword);
    await this.userRepository.update(userId, { passwordHash: newPasswordHash });
    
    eventBus.emit('user.password_changed', { userId });
  }

  /**
   * Calculates storage metrics based on current consumption and user limits
   */
  public async getStorageAnalytics(userId: string): Promise<{
    storageUsed: number;
    storageLimit: number;
    usagePercentage: number;
    remainingStorage: number;
  }> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User profile not found');
    }

    const storageUsed = user.storageUsed || 0;
    const storageLimit = user.storageLimit || 5 * 1024 * 1024 * 1024; // Default 5 GB
    const usagePercentage = Number(((storageUsed / storageLimit) * 100).toFixed(2));
    const remainingStorage = Math.max(0, storageLimit - storageUsed);

    return {
      storageUsed,
      storageLimit,
      usagePercentage,
      remainingStorage,
    };
  }

  /**
   * Resolves activity summaries (uploaded, shared, favorites) for user's dashboard
   */
  public async getActivitySummary(userId: string): Promise<{
    filesUploaded: number;
    filesShared: number;
    favoritesCount: number;
    recentActivityCount: number;
  }> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User profile not found');
    }

    return {
      filesUploaded: user.filesUploadedCount || 0,
      filesShared: user.filesSharedCount || 0,
      favoritesCount: user.favoritesCount || 0,
      recentActivityCount: user.recentActivityCount || 0,
    };
  }
}
