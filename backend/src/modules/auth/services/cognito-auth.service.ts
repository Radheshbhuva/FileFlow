import { AuthProviderFactory } from '../providers/auth-provider.factory';
import { UserSyncService } from './user-sync.service';
import { RepositoryRegistry } from '../../database/repositories/registry';
import { CognitoAuthProvider } from '../providers/cognito-auth.provider';
import { PasswordService } from './password.service';
import { BadRequestError } from '../../../utils/app-error';

export class CognitoAuthService {
  private userSyncService: UserSyncService;
  private userRepository = RepositoryRegistry.getUserRepository();

  constructor() {
    this.userSyncService = new UserSyncService(this.userRepository);
  }

  private getProvider() {
    return AuthProviderFactory.getProvider();
  }

  public async registerUser(dto: { email: string; password?: string; fullName: string }): Promise<any> {
    const provider = this.getProvider();
    const result = await provider.register(dto);
    
    // Sync / create the local profile
    const user = await this.syncUserProfile(
      result.sub,
      result.email,
      dto.fullName,
      { planType: 'FREE', role: 'USER' }
    );
    
    return user;
  }

  public async authenticateUser(dto: { email: string; password?: string }): Promise<any> {
    const provider = this.getProvider();
    const authResponse = await provider.login(dto);

    // Sync profile
    const user = await this.syncUserProfile(
      authResponse.sub,
      authResponse.email,
      undefined,
      undefined
    );

    return {
      accessToken: authResponse.accessToken,
      idToken: authResponse.idToken,
      refreshToken: authResponse.refreshToken,
      user,
    };
  }

  public async verifyUser(email: string): Promise<void> {
    const provider = this.getProvider();
    await provider.verifyEmail(email);

    // Update internal status
    const user = await this.userRepository.findByEmail(email);
    if (user) {
      await this.userRepository.update(user.id, {
        emailVerified: true,
        accountStatus: 'ACTIVE',
      });
    }
  }

  public async refreshTokens(refreshToken: string, email: string): Promise<any> {
    const provider = this.getProvider();
    return provider.refreshSession(refreshToken, email);
  }

  public async resetPassword(email: string, code: string, passwordHashOrPlain: string): Promise<void> {
    const provider = this.getProvider();
    await provider.resetPassword(email, code, passwordHashOrPlain);

    const user = await this.userRepository.findByEmail(email);
    if (user) {
      const isCognito = process.env.AUTH_PROVIDER === 'cognito';
      const passwordHash = isCognito ? 'COGNITO_MANAGED' : await PasswordService.hash(passwordHashOrPlain);
      await this.userRepository.update(user.id, {
        passwordHash,
        resetPasswordToken: undefined,
        resetPasswordExpiresAt: undefined,
      });
    }
  }

  public async changePassword(email: string, oldPassword?: string, newPassword?: string): Promise<void> {
    const provider = this.getProvider();
    if (provider instanceof CognitoAuthProvider && newPassword) {
      await provider.setUserPassword(email, newPassword);
    } else if (newPassword) {
      const passwordHash = await PasswordService.hash(newPassword);
      await provider.setUserPassword(email, passwordHash);
    }
  }

  public async syncUserProfile(
    sub: string,
    email: string,
    name?: string,
    attrs?: Record<string, any>
  ): Promise<any> {
    return this.userSyncService.syncUser(sub, email, name, attrs);
  }
}

export const cognitoAuthService = new CognitoAuthService();
