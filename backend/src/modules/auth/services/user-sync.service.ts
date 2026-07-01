import { RepositoryRegistry } from '../../database/repositories/registry';
import { User, UserRepository } from '../interfaces/user.interface';
import { WorkspaceRepository } from '../../database/interfaces/workspace.interface';

export class UserSyncService {
  private userRepository: UserRepository;
  private workspaceRepository: WorkspaceRepository;

  constructor(
    userRepository: UserRepository = RepositoryRegistry.getUserRepository(),
    workspaceRepository: WorkspaceRepository = RepositoryRegistry.getWorkspaceRepository()
  ) {
    this.userRepository = userRepository;
    this.workspaceRepository = workspaceRepository;
  }

  /**
   * Synchronizes an authenticated Cognito user with a local profile in the database.
   * If the user profile does not exist:
   *   - Searches for an existing user by email (for hybrid legacy user migration).
   *   - If found, updates the profile with the user's `cognitoSub`.
   *   - If not found, creates a new user profile using the sub/email.
   * Also verifies that a default Workspace is initialized and linked to the User profile.
   */
  public async syncUser(
    sub: string,
    email: string,
    fullName?: string,
    customAttributes?: Record<string, any>
  ): Promise<User> {
    const normalizedEmail = email.toLowerCase().trim();

    // 1. Try to find user profile by email (migration link candidate)
    let user = await this.userRepository.findByEmail(normalizedEmail);

    if (user) {
      // If user exists, update their cognitoSub if missing
      if (!user.cognitoSub) {
        user = await this.userRepository.update(user.id, {
          cognitoSub: sub,
        });
      }
    } else {
      // 2. Create user profile in database
      user = await this.userRepository.create({
        fullName: fullName || email.split('@')[0],
        email: normalizedEmail,
        passwordHash: 'COGNITO_MANAGED', // Password checking is handled by Cognito Provider
        role: 'USER',
        planType: (customAttributes?.planType as any) || 'FREE',
        emailVerified: true,
        accountStatus: 'ACTIVE',
        verificationToken: undefined,
        verificationTokenExpiresAt: undefined,
      });

      // Link the cognitoSub
      user = await this.userRepository.update(user.id, {
        cognitoSub: sub,
      });
    }

    // 3. Ensure a default workspace is initialized for this user
    const workspaces = await this.workspaceRepository.findByOwnerId(user.id);
    if (workspaces.length === 0) {
      await this.workspaceRepository.create({
        name: 'Default Workspace',
        ownerId: user.id,
        metadata: {
          createdVia: 'COGNITO_SYNC',
        },
      });
    }

    return user;
  }
}
