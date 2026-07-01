import crypto from 'crypto';
import supertest from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../src/app';
import { TokenService } from '../src/modules/auth/services/token.service';
import { InMemoryUserRepository } from '../src/modules/auth/repositories/user.repository';
import { InMemoryWorkspaceRepository } from '../src/modules/database/repositories/inmemory-workspace.repository';
import { RepositoryRegistry } from '../src/modules/database/repositories/registry';
import { MockAuthProvider } from '../src/modules/auth/providers/mock-auth.provider';
import { CognitoAuthProvider } from '../src/modules/auth/providers/cognito-auth.provider';
import { AuthProviderFactory } from '../src/modules/auth/providers/auth-provider.factory';
import { UserSyncService } from '../src/modules/auth/services/user-sync.service';
import { PasswordService } from '../src/modules/auth/services/password.service';

// Mock Cognito client command sends using plain classes to prevent Jest mock reset issues
const mockSend = jest.fn();
jest.mock('@aws-sdk/client-cognito-identity-provider', () => {
  return {
    __esModule: true,
    CognitoIdentityProviderClient: class {
      send(command: any) {
        return mockSend(command);
      }
    },
    SignUpCommand: class {
      constructor(public args: any) {}
    },
    InitiateAuthCommand: class {
      constructor(public args: any) {}
    },
    AdminConfirmSignUpCommand: class {
      constructor(public args: any) {}
    },
    AdminSetUserPasswordCommand: class {
      constructor(public args: any) {}
    },
    AdminDeleteUserCommand: class {
      constructor(public args: any) {}
    },
    GetUserCommand: class {
      constructor(public args: any) {}
    },
    GlobalSignOutCommand: class {
      constructor(public args: any) {}
    },
    ForgotPasswordCommand: class {
      constructor(public args: any) {}
    },
    ConfirmForgotPasswordCommand: class {
      constructor(public args: any) {}
    },
  };
});

// Generate local RS256 key pair to sign and verify Cognito mock tokens offline
const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

let mockPublicKey: string = publicKey;

jest.mock('jwks-rsa', () => {
  return {
    __esModule: true,
    default: (options: any) => {
      return {
        getSigningKey: (kid: string, callback: any) => {
          callback(null, {
            getPublicKey: () => mockPublicKey,
          });
        },
      };
    },
  };
});

describe('FileFlow Cognito Migration Layer Tests', () => {
  const userRepository = InMemoryUserRepository.getInstance();
  const workspaceRepository = InMemoryWorkspaceRepository.getInstance();

  beforeEach(() => {
    userRepository.clear();
    workspaceRepository.clear();
    mockSend.mockReset();
    AuthProviderFactory.reset();
    delete process.env.AUTH_PROVIDER;
    delete process.env.COGNITO_USER_POOL_ID;
    delete process.env.COGNITO_CLIENT_ID;
    delete process.env.COGNITO_CLIENT_SECRET;
  });

  describe('AuthProviderFactory', () => {
    it('should default to MockAuthProvider if env variables are not set', () => {
      const provider = AuthProviderFactory.getProvider();
      expect(provider).toBeInstanceOf(MockAuthProvider);
    });

    it('should return CognitoAuthProvider if AUTH_PROVIDER is cognito and keys are configured', () => {
      process.env.AUTH_PROVIDER = 'cognito';
      process.env.COGNITO_USER_POOL_ID = 'us-east-1_xxxxxxxxx';
      process.env.COGNITO_CLIENT_ID = 'yyyyyyyyy';

      const provider = AuthProviderFactory.getProvider();
      expect(provider).toBeInstanceOf(CognitoAuthProvider);
    });
  });

  describe('MockAuthProvider Direct Operations', () => {
    it('should register and authenticate successfully in mock mode', async () => {
      const provider = new MockAuthProvider();
      const email = 'mock-user@fileflow.com';
      const fullName = 'Mock User';
      const password = 'Password123!';

      const regRes = await provider.register({ email, fullName, password });
      expect(regRes.email).toBe(email);
      expect(regRes.sub).toBeDefined();

      const passwordHash = await PasswordService.hash(password);

      // Setup database user mock to authenticate
      const user = await userRepository.create({
        fullName,
        email,
        passwordHash,
        role: 'USER',
        planType: 'FREE',
        emailVerified: false,
        accountStatus: 'PENDING_VERIFICATION',
      });

      const authRes = await provider.authenticate({ email, password });
      expect(authRes.email).toBe(email);
      expect(authRes.sub).toBe(user.id);
      expect(authRes.accessToken).toBeDefined();

      const userPayload = await provider.getUser(authRes.accessToken);
      expect(userPayload.email).toBe(email);
      expect(userPayload.sub).toBe(user.id);
    });
  });

  describe('CognitoAuthProvider Direct Operations (Mocked SDK)', () => {
    let cognitoProvider: CognitoAuthProvider;

    beforeEach(() => {
      process.env.AUTH_PROVIDER = 'cognito';
      process.env.COGNITO_USER_POOL_ID = 'us-east-1_pool';
      process.env.COGNITO_CLIENT_ID = 'client_id';
      process.env.COGNITO_CLIENT_SECRET = 'client_secret';
      cognitoProvider = new CognitoAuthProvider();
    });

    it('should register user via Cognito client SignUpCommand', async () => {
      mockSend.mockResolvedValueOnce({
        UserSub: 'cognito-sub-123',
      });

      const res = await cognitoProvider.register({
        email: 'test@fileflow.com',
        fullName: 'Test User',
        password: 'Password123!',
      });

      expect(res.sub).toBe('cognito-sub-123');
      expect(res.email).toBe('test@fileflow.com');
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should authenticate user and resolve user attributes using InitiateAuth + GetUser', async () => {
      mockSend
        .mockResolvedValueOnce({
          AuthenticationResult: {
            AccessToken: 'cognito-access-token',
            IdToken: 'cognito-id-token',
            RefreshToken: 'cognito-refresh-token',
          },
        })
        .mockResolvedValueOnce({
          Username: 'cognito-sub-123',
          UserAttributes: [
            { Name: 'email', Value: 'test@fileflow.com' },
            { Name: 'name', Value: 'Test User' },
            { Name: 'custom:planType', Value: 'PRO' },
          ],
        });

      const res = await cognitoProvider.authenticate({
        email: 'test@fileflow.com',
        password: 'Password123!',
      });

      expect(res.accessToken).toBe('cognito-access-token');
      expect(res.sub).toBe('cognito-sub-123');
      expect(res.email).toBe('test@fileflow.com');
      expect(mockSend).toHaveBeenCalledTimes(2);
    });

    it('should login, verify email, logout, forgotPassword, and resetPassword successfully', async () => {
      // 1. Test login (delegating to authenticate under the hood)
      mockSend
        .mockResolvedValueOnce({
          AuthenticationResult: {
            AccessToken: 'cognito-access-token',
            IdToken: 'cognito-id-token',
            RefreshToken: 'cognito-refresh-token',
          },
        })
        .mockResolvedValueOnce({
          Username: 'cognito-sub-123',
          UserAttributes: [
            { Name: 'email', Value: 'test@fileflow.com' },
            { Name: 'name', Value: 'Test User' },
          ],
        });

      const loginRes = await cognitoProvider.login({
        email: 'test@fileflow.com',
        password: 'Password123!',
      });
      expect(loginRes.accessToken).toBe('cognito-access-token');
      expect(mockSend).toHaveBeenCalledTimes(2);
      mockSend.mockClear();

      // 2. Test verifyEmail (delegating to confirmSignUp)
      mockSend.mockResolvedValueOnce({});
      await cognitoProvider.verifyEmail('test@fileflow.com');
      expect(mockSend).toHaveBeenCalledTimes(1);
      mockSend.mockClear();

      // 3. Test logout (calling GlobalSignOutCommand)
      mockSend.mockResolvedValueOnce({});
      await cognitoProvider.logout('cognito-access-token');
      expect(mockSend).toHaveBeenCalledTimes(1);
      mockSend.mockClear();

      // 4. Test forgotPassword (calling ForgotPasswordCommand)
      mockSend.mockResolvedValueOnce({});
      await cognitoProvider.forgotPassword('test@fileflow.com');
      expect(mockSend).toHaveBeenCalledTimes(1);
      mockSend.mockClear();

      // 5. Test resetPassword (calling ConfirmForgotPasswordCommand)
      mockSend.mockResolvedValueOnce({});
      await cognitoProvider.resetPassword('test@fileflow.com', '123456', 'NewPassword123!');
      expect(mockSend).toHaveBeenCalledTimes(1);
    });
  });

  describe('UserSyncService', () => {
    it('should create new database profile and auto-provision default workspace if not found', async () => {
      const syncService = new UserSyncService(userRepository, workspaceRepository);
      const email = 'sync-user@fileflow.com';
      const sub = 'cognito-sub-uuid';

      const user = await syncService.syncUser(sub, email, 'Sync User', { planType: 'PRO' });
      expect(user.email).toBe(email);
      expect(user.cognitoSub).toBe(sub);
      expect(user.planType).toBe('PRO');

      const workspaces = await workspaceRepository.findByOwnerId(user.id);
      expect(workspaces.length).toBe(1);
      expect(workspaces[0].name).toBe('Default Workspace');
    });

    it('should link existing legacy profile by email and bind cognitoSub', async () => {
      // Pre-create user without cognitoSub (migration candidate)
      const email = 'legacy-user@fileflow.com';
      const legacyUser = await userRepository.create({
        fullName: 'Legacy User',
        email,
        passwordHash: 'legacy-hash',
        role: 'USER',
        planType: 'FREE',
        emailVerified: true,
        accountStatus: 'ACTIVE',
      });

      // Pre-create a workspace for the user before any sync
      await workspaceRepository.create({
        name: 'Existing Workspace',
        ownerId: legacyUser.id,
      });

      const syncService = new UserSyncService(userRepository, workspaceRepository);
      const sub = 'cognito-sub-uuid-legacy';

      // Perform sync
      const user = await syncService.syncUser(sub, email);
      expect(user.id).toBe(legacyUser.id);
      expect(user.cognitoSub).toBe(sub);

      // Verify that no extra workspace was created since they already had one
      const workspaces = await workspaceRepository.findByOwnerId(legacyUser.id);
      expect(workspaces.length).toBe(1); // Still only the "Existing Workspace"
      expect(workspaces[0].name).toBe('Existing Workspace');
    });
  });

  describe('TokenService Hybrid Verification', () => {
    it('should verify local token signed using HS256', async () => {
      const payload = {
        sub: 'local-user-id',
        email: 'local@fileflow.com',
        role: 'USER' as const,
        planType: 'FREE' as const,
      };

      const token = TokenService.generateAccessToken(payload);
      const decoded = await TokenService.verifyAccessToken(token);

      expect(decoded.sub).toBe(payload.sub);
      expect(decoded.email).toBe(payload.email);
    });

    it('should verify Cognito simulated token signed using RS256 via JWKS fallback', async () => {
      process.env.AUTH_PROVIDER = 'cognito';
      process.env.COGNITO_USER_POOL_ID = 'us-east-1_pool';

      const payload = {
        sub: 'cognito-sub-uuid',
        email: 'cognito@fileflow.com',
        'custom:role': 'ADMIN',
        'custom:planType': 'ENTERPRISE',
        iss: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_pool',
      };

      const token = jwt.sign(payload, privateKey, {
        algorithm: 'RS256',
        keyid: 'kid-123',
      });

      const decoded = await TokenService.verifyAccessToken(token);
      expect(decoded.sub).toBe(payload.sub);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.role).toBe('ADMIN');
      expect(decoded.planType).toBe('ENTERPRISE');
    });
  });

  describe('protect Authentication Middleware Integration', () => {
    it('should inject user profile context matching by email when Cognito token is verified', async () => {
      process.env.AUTH_PROVIDER = 'cognito';
      process.env.COGNITO_USER_POOL_ID = 'us-east-1_pool';

      // Setup database profile linked to Cognito Sub
      const email = 'auth-middleware@fileflow.com';
      await userRepository.create({
        fullName: 'Authenticated User',
        email,
        passwordHash: 'COGNITO_MANAGED',
        role: 'USER',
        planType: 'FREE',
        emailVerified: true,
        accountStatus: 'ACTIVE',
        cognitoSub: 'cognito-sub-uuid-middleware',
      });

      const payload = {
        sub: 'cognito-sub-uuid-middleware',
        email,
        iss: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_pool',
      };

      const token = jwt.sign(payload, privateKey, {
        algorithm: 'RS256',
        keyid: 'kid-123',
      });

      const res = await supertest(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(email);
    });
  });
});
