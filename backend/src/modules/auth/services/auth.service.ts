import crypto from 'crypto';
import { UserRepository, User } from '../interfaces/user.interface';
import { RepositoryRegistry } from '../../database/repositories/registry';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';
import { TokenPayload } from '../types/auth.types';
import { eventBus } from '../../../shared/event-bus';
import {
  ConflictError,
  UnauthorizedError,
  BadRequestError,
  ForbiddenError,
} from '../../../utils/app-error';
import { AuthProviderFactory } from '../providers/auth-provider.factory';
import { UserSyncService } from './user-sync.service';

export class AuthService {
  private userRepository: UserRepository;
  private userSyncService: UserSyncService;

  constructor(userRepository: UserRepository = RepositoryRegistry.getUserRepository()) {
    this.userRepository = userRepository;
    this.userSyncService = new UserSyncService(this.userRepository);
  }

  /**
   * Registers a new user. Calls the active AuthProvider and registers the profile.
   */
  public async register(dto: any): Promise<Omit<User, 'passwordHash'>> {
    const existingUser = await this.userRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictError('A user with this email address already exists');
    }

    const provider = AuthProviderFactory.getProvider();
    
    let registered;
    try {
      registered = await provider.register({
        email: dto.email,
        password: dto.password,
        fullName: dto.fullName,
      });
    } catch (err: any) {
      if (err.message && err.message.includes('already exists')) {
        throw new ConflictError('A user with this email address already exists');
      }
      throw err;
    }

    const isCognito = process.env.AUTH_PROVIDER === 'cognito';
    const passwordHash = isCognito ? 'COGNITO_MANAGED' : await PasswordService.hash(dto.password);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const user = await this.userRepository.create({
      fullName: dto.fullName,
      email: registered.email,
      passwordHash,
      role: 'USER',
      planType: 'FREE',
      emailVerified: false,
      accountStatus: 'PENDING_VERIFICATION',
      verificationToken,
      verificationTokenExpiresAt,
      cognitoSub: registered.sub,
    });

    // Ensure a default workspace is initialized for this user
    const workspaceRepository = RepositoryRegistry.getWorkspaceRepository();
    const workspaces = await workspaceRepository.findByOwnerId(user.id);
    if (workspaces.length === 0) {
      await workspaceRepository.create({
        name: 'Default Workspace',
        ownerId: user.id,
        metadata: {
          createdVia: 'COGNITO_REGISTER',
        },
      });
    }

    eventBus.emit('user.registered', { userId: user.id, email: user.email });

    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Log in user. Verifies credentials via Cognito or Mock, and syncs user state.
   */
  public async login(dto: any): Promise<{ accessToken: string; user: Omit<User, 'passwordHash'> }> {
    const provider = AuthProviderFactory.getProvider();
    
    // Authenticate via Cognito or Mock provider
    const authResponse = await provider.authenticate({
      email: dto.email,
      password: dto.password,
    });

    // Synchronize the profile details in DynamoDB/InMemory DB
    const user = await this.userSyncService.syncUser(
      authResponse.sub,
      authResponse.email,
      undefined
    );

    if (user.accountStatus === 'SUSPENDED') {
      throw new ForbiddenError('Your account has been suspended. Please contact support.');
    }

    // Update lastLogin
    const now = new Date();
    await this.userRepository.update(user.id, { lastLogin: now });
    user.lastLogin = now;

    eventBus.emit('user.logged_in', { userId: user.id, email: user.email });

    const { passwordHash: _, ...userWithoutPassword } = user;
    return { accessToken: authResponse.accessToken, user: userWithoutPassword };
  }

  /**
   * Verifies email using verification token.
   */
  public async verifyEmail(token: string): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.userRepository.findByVerificationToken(token);
    if (!user) {
      throw new BadRequestError('Invalid or expired email verification token');
    }

    if (user.verificationTokenExpiresAt && user.verificationTokenExpiresAt < new Date()) {
      throw new BadRequestError('Email verification token has expired');
    }

    const provider = AuthProviderFactory.getProvider();
    await provider.confirmSignUp(user.email);

    const updatedUser = await this.userRepository.update(user.id, {
      emailVerified: true,
      accountStatus: 'ACTIVE',
      verificationToken: undefined,
      verificationTokenExpiresAt: undefined,
    });

    const { passwordHash: _, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  /**
   * Initiates forgot password flow.
   * Generates secure reset token and saves validation bounds.
   */
  public async forgotPassword(email: string): Promise<{ resetToken: string }> {
    const user = await this.userRepository.findByEmail(email);

    // Standard security recommendation: return success to prevent email verification probing/enumeration.
    // However, we still return the token so the service/controllers/tests can track it.
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetPasswordExpiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

    if (user) {
      await this.userRepository.update(user.id, {
        resetPasswordToken: resetToken,
        resetPasswordExpiresAt,
      });
    }

    return { resetToken };
  }

  /**
   * Resets password using reset token.
   */
  public async resetPassword(dto: any): Promise<void> {
    const user = await this.userRepository.findByResetToken(dto.token);
    if (!user) {
      throw new BadRequestError('Invalid or expired password reset token');
    }

    if (user.resetPasswordExpiresAt && user.resetPasswordExpiresAt < new Date()) {
      throw new BadRequestError('Password reset token has expired');
    }

    const provider = AuthProviderFactory.getProvider();
    const isCognito = process.env.AUTH_PROVIDER === 'cognito';

    if (isCognito) {
      // Cognito expects the plain-text password
      await provider.setUserPassword(user.email, dto.password);
      
      await this.userRepository.update(user.id, {
        passwordHash: 'COGNITO_MANAGED',
        resetPasswordToken: undefined,
        resetPasswordExpiresAt: undefined,
      });
    } else {
      // Mock / local expects the hashed password
      const passwordHash = await PasswordService.hash(dto.password);
      await provider.setUserPassword(user.email, passwordHash);
      
      await this.userRepository.update(user.id, {
        resetPasswordToken: undefined,
        resetPasswordExpiresAt: undefined,
      });
    }
  }
}
