import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  InitiateAuthCommand,
  AdminConfirmSignUpCommand,
  AdminSetUserPasswordCommand,
  AdminDeleteUserCommand,
  GetUserCommand,
  GlobalSignOutCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import crypto from 'crypto';
import { AuthProvider, AuthResponse, AuthUserPayload } from '../interfaces/auth-provider.interface';
import { env } from '../../../config/env';
import { BadRequestError, UnauthorizedError } from '../../../utils/app-error';

export class CognitoAuthProvider implements AuthProvider {
  private client: CognitoIdentityProviderClient;
  private userPoolId: string;
  private clientId: string;
  private clientSecret?: string;

  constructor() {
    this.userPoolId = process.env.COGNITO_USER_POOL_ID || '';
    this.clientId = process.env.COGNITO_CLIENT_ID || '';
    this.clientSecret = process.env.COGNITO_CLIENT_SECRET;
    const region = process.env.AWS_REGION || 'us-east-1';

    this.client = new CognitoIdentityProviderClient({ region });
  }

  /**
   * Calculates the SecretHash required by Cognito when a Client Secret is configured
   */
  private getSecretHash(username: string): string | undefined {
    if (!this.clientSecret) return undefined;
    return crypto
      .createHmac('sha256', this.clientSecret)
      .update(username + this.clientId)
      .digest('base64');
  }

  public async register(dto: { email: string; password?: string; fullName: string }): Promise<{ sub: string; email: string }> {
    const password = dto.password || 'TempPassword123!';
    const username = dto.email.toLowerCase().trim();
    const secretHash = this.getSecretHash(username);

    const command = new SignUpCommand({
      ClientId: this.clientId,
      Username: username,
      Password: password,
      SecretHash: secretHash,
      UserAttributes: [
        { Name: 'email', Value: username },
        { Name: 'name', Value: dto.fullName },
        { Name: 'custom:planType', Value: 'FREE' }, // Default Plan
      ],
    });

    try {
      const result = await this.client.send(command);
      if (!result.UserSub) {
        throw new BadRequestError('Failed to register user in Cognito (no UserSub returned)');
      }
      return {
        sub: result.UserSub,
        email: username,
      };
    } catch (err: any) {
      if (err.name === 'UsernameExistsException') {
        throw new BadRequestError('A user with this email address already exists');
      }
      throw new BadRequestError(err.message || 'Cognito signup failed');
    }
  }

  public async authenticate(dto: { email: string; password?: string }): Promise<AuthResponse> {
    const username = dto.email.toLowerCase().trim();
    const password = dto.password || '';
    const secretHash = this.getSecretHash(username);

    const authParameters: Record<string, string> = {
      USERNAME: username,
      PASSWORD: password,
    };

    if (secretHash) {
      authParameters.SECRET_HASH = secretHash;
    }

    const command = new InitiateAuthCommand({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: this.clientId,
      AuthParameters: authParameters,
    });

    try {
      const result = await this.client.send(command);
      const authResult = result.AuthenticationResult;

      if (!authResult || !authResult.AccessToken) {
        throw new UnauthorizedError('Authentication failed: Missing tokens');
      }

      // Fetch user profile using the AccessToken to resolve Cognito sub
      const userInfo = await this.getUser(authResult.AccessToken);

      return {
        accessToken: authResult.AccessToken,
        idToken: authResult.IdToken,
        refreshToken: authResult.RefreshToken,
        sub: userInfo.sub,
        email: username,
      };
    } catch (err: any) {
      if (err.name === 'NotAuthorizedException' || err.name === 'UserNotFoundException') {
        throw new UnauthorizedError('Invalid email or password');
      }
      if (err.name === 'UserNotConfirmedException') {
        throw new UnauthorizedError('Email address has not been verified yet');
      }
      throw new UnauthorizedError(err.message || 'Cognito login failed');
    }
  }

  public async confirmSignUp(email: string): Promise<void> {
    const username = email.toLowerCase().trim();
    const command = new AdminConfirmSignUpCommand({
      UserPoolId: this.userPoolId,
      Username: username,
    });

    try {
      await this.client.send(command);
    } catch (err: any) {
      throw new BadRequestError(err.message || 'Cognito confirm signup failed');
    }
  }

  public async setUserPassword(email: string, passwordHash: string): Promise<void> {
    // In Cognito, we set the password directly via AdminSetUserPassword
    const username = email.toLowerCase().trim();
    const command = new AdminSetUserPasswordCommand({
      UserPoolId: this.userPoolId,
      Username: username,
      Password: passwordHash, // Cognito expects the plain-text password to be set
      Permanent: true,
    });

    try {
      await this.client.send(command);
    } catch (err: any) {
      throw new BadRequestError(err.message || 'Cognito set password failed');
    }
  }

  public async refreshSession(refreshToken: string, email: string): Promise<Partial<AuthResponse>> {
    const username = email.toLowerCase().trim();
    const secretHash = this.getSecretHash(username);

    const authParameters: Record<string, string> = {
      REFRESH_TOKEN: refreshToken,
    };

    if (secretHash) {
      authParameters.SECRET_HASH = secretHash;
    }

    const command = new InitiateAuthCommand({
      AuthFlow: 'REFRESH_TOKEN_AUTH',
      ClientId: this.clientId,
      AuthParameters: authParameters,
    });

    try {
      const result = await this.client.send(command);
      const authResult = result.AuthenticationResult;

      if (!authResult || !authResult.AccessToken) {
        throw new UnauthorizedError('Failed to refresh Cognito session');
      }

      return {
        accessToken: authResult.AccessToken,
        idToken: authResult.IdToken,
      };
    } catch (err: any) {
      throw new UnauthorizedError(err.message || 'Cognito token refresh failed');
    }
  }

  public async getUser(accessToken: string): Promise<AuthUserPayload> {
    const command = new GetUserCommand({
      AccessToken: accessToken,
    });

    try {
      const result = await this.client.send(command);
      
      let email = '';
      let fullName = '';
      const customAttributes: Record<string, any> = {};

      if (result.UserAttributes) {
        for (const attr of result.UserAttributes) {
          if (attr.Name === 'email') {
            email = attr.Value || '';
          } else if (attr.Name === 'name') {
            fullName = attr.Value || '';
          } else if (attr.Name?.startsWith('custom:')) {
            const key = attr.Name.replace('custom:', '');
            customAttributes[key] = attr.Value;
          }
        }
      }

      return {
        sub: result.Username || '', // Cognito GetUser returns UserSub/Username as Username property
        email,
        fullName,
        customAttributes,
      };
    } catch (err: any) {
      throw new UnauthorizedError(err.message || 'Failed to retrieve Cognito user profile');
    }
  }

  public async deleteUser(email: string): Promise<void> {
    const username = email.toLowerCase().trim();
    const command = new AdminDeleteUserCommand({
      UserPoolId: this.userPoolId,
      Username: username,
    });

    try {
      await this.client.send(command);
    } catch (err: any) {
      throw new BadRequestError(err.message || 'Cognito delete user failed');
    }
  }

  public async login(dto: { email: string; password?: string }): Promise<AuthResponse> {
    return this.authenticate(dto);
  }

  public async logout(accessToken: string): Promise<void> {
    const command = new GlobalSignOutCommand({
      AccessToken: accessToken,
    });

    try {
      await this.client.send(command);
    } catch (err: any) {
      throw new BadRequestError(err.message || 'Cognito logout failed');
    }
  }

  public async verifyEmail(email: string): Promise<void> {
    return this.confirmSignUp(email);
  }

  public async forgotPassword(email: string): Promise<void> {
    const username = email.toLowerCase().trim();
    const secretHash = this.getSecretHash(username);

    const command = new ForgotPasswordCommand({
      ClientId: this.clientId,
      Username: username,
      SecretHash: secretHash,
    });

    try {
      await this.client.send(command);
    } catch (err: any) {
      throw new BadRequestError(err.message || 'Cognito forgot password flow initiation failed');
    }
  }

  public async resetPassword(email: string, code: string, passwordHashOrPlain: string): Promise<void> {
    const username = email.toLowerCase().trim();
    const secretHash = this.getSecretHash(username);

    const command = new ConfirmForgotPasswordCommand({
      ClientId: this.clientId,
      Username: username,
      ConfirmationCode: code,
      Password: passwordHashOrPlain, // Cognito expects the plain-text password
      SecretHash: secretHash,
    });

    try {
      await this.client.send(command);
    } catch (err: any) {
      throw new BadRequestError(err.message || 'Cognito reset password failed');
    }
  }
}
