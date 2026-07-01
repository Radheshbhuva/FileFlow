import { AuthProvider } from '../interfaces/auth-provider.interface';
import { CognitoAuthProvider } from './cognito-auth.provider';
import { MockAuthProvider } from './mock-auth.provider';

export class AuthProviderFactory {
  private static providerInstance: AuthProvider;

  /**
   * Retrieves the active AuthProvider implementation based on environment configuration
   */
  public static getProvider(): AuthProvider {
    if (!this.providerInstance) {
      const providerType = process.env.AUTH_PROVIDER || 'mock';
      const hasCognitoConfig = 
        process.env.COGNITO_USER_POOL_ID && 
        process.env.COGNITO_CLIENT_ID;

      if (providerType === 'cognito' && hasCognitoConfig) {
        this.providerInstance = new CognitoAuthProvider();
      } else {
        this.providerInstance = new MockAuthProvider();
      }
    }
    return this.providerInstance;
  }

  /**
   * Resets the cached provider instance (useful for test resets)
   */
  public static reset(): void {
    (this.providerInstance as any) = null;
  }
}
