import { AuthProvider, AuthResponse, AuthUserPayload } from '../interfaces/auth-provider.interface';
import { RepositoryRegistry } from '../../database/repositories/registry';
import { PasswordService } from '../services/password.service';
import { TokenService } from '../services/token.service';
import { UnauthorizedError, ConflictError, BadRequestError } from '../../../utils/app-error';
import { v4 as uuidv4 } from 'uuid';

export class MockAuthProvider implements AuthProvider {
  public async register(dto: { email: string; password?: string; fullName: string }): Promise<{ sub: string; email: string }> {
    const userRepo = RepositoryRegistry.getUserRepository();
    const existing = await userRepo.findByEmail(dto.email);
    if (existing) {
      throw new ConflictError('A user with this email address already exists');
    }
    
    // Simulate Cognito sub generation
    const sub = uuidv4();
    return { sub, email: dto.email.toLowerCase().trim() };
  }

  public async authenticate(dto: { email: string; password?: string }): Promise<AuthResponse> {
    const userRepo = RepositoryRegistry.getUserRepository();
    const user = await userRepo.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (dto.password) {
      const isMatch = await PasswordService.compare(dto.password, user.passwordHash);
      if (!isMatch) {
        throw new UnauthorizedError('Invalid email or password');
      }
    }

    // Generate local JWT access token
    const tokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      planType: user.planType,
    };
    const accessToken = TokenService.generateAccessToken(tokenPayload);

    return {
      accessToken,
      idToken: accessToken, // Simulate ID token
      refreshToken: 'mock-refresh-token-' + uuidv4(),
      sub: user.id,
      email: user.email,
    };
  }

  public async confirmSignUp(email: string): Promise<void> {
    // Mock confirmation does not need network calls
    return;
  }

  public async setUserPassword(email: string, passwordHash: string): Promise<void> {
    const userRepo = RepositoryRegistry.getUserRepository();
    const user = await userRepo.findByEmail(email);
    if (!user) {
      throw new BadRequestError('User not found');
    }
    await userRepo.update(user.id, { passwordHash });
  }

  public async refreshSession(refreshToken: string, email: string): Promise<Partial<AuthResponse>> {
    const userRepo = RepositoryRegistry.getUserRepository();
    const user = await userRepo.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    const tokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      planType: user.planType,
    };
    const accessToken = TokenService.generateAccessToken(tokenPayload);

    return {
      accessToken,
      idToken: accessToken,
    };
  }

  public async getUser(accessToken: string): Promise<AuthUserPayload> {
    try {
      const decoded = await TokenService.verifyAccessToken(accessToken);
      return {
        sub: decoded.sub,
        email: decoded.email,
      };
    } catch (err) {
      throw new UnauthorizedError('Invalid token');
    }
  }

  public async deleteUser(email: string): Promise<void> {
    const userRepo = RepositoryRegistry.getUserRepository();
    const user = await userRepo.findByEmail(email);
    if (user) {
      await userRepo.delete(user.id);
    }
  }

  public async login(dto: { email: string; password?: string }): Promise<AuthResponse> {
    return this.authenticate(dto);
  }

  public async logout(accessToken: string): Promise<void> {
    // Mock logout is a success no-op
    return;
  }

  public async verifyEmail(email: string): Promise<void> {
    return this.confirmSignUp(email);
  }

  public async forgotPassword(email: string): Promise<void> {
    // Mock forgot password is a success no-op
    return;
  }

  public async resetPassword(email: string, code: string, passwordHashOrPlain: string): Promise<void> {
    let finalHash = passwordHashOrPlain;
    if (!passwordHashOrPlain.startsWith('$2a$') && !passwordHashOrPlain.startsWith('$2b$')) {
      finalHash = await PasswordService.hash(passwordHashOrPlain);
    }
    return this.setUserPassword(email, finalHash);
  }
}
