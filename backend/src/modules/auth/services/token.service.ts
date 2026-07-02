import jwt from 'jsonwebtoken';
import jwksRsa from 'jwks-rsa';
import { env } from '../../../config/env';
import { TokenPayload } from '../types/auth.types';

export class TokenService {
  private static readonly SECRET = env.JWT_SECRET;
  private static readonly EXPIRES_IN = env.JWT_EXPIRES_IN;

  /**
   * Generates a signed JWT Access Token holding the user payload
   */
  public static generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, this.SECRET, {
      expiresIn: this.EXPIRES_IN as any,
    });
  }

  /**
   * Verifies a JWT Access Token, supporting Cognito (RS256) and Local (HS256) hybrid verification
   */
  public static async verifyAccessToken(token: string): Promise<TokenPayload> {
    const decodedUnverified = jwt.decode(token, { complete: true }) as any;
    if (!decodedUnverified) {
      throw new Error('Invalid token format');
    }

    const iss = decodedUnverified.payload?.iss;
    const isCognito = iss && iss.includes('cognito-idp');

    if (isCognito && process.env.AUTH_PROVIDER === 'cognito') {
      const kid = decodedUnverified.header?.kid;
      if (!kid) {
        throw new Error('Missing key ID in token header');
      }

      const region = process.env.AWS_REGION || 'us-east-1';
      const userPoolId = process.env.COGNITO_USER_POOL_ID;

      const jwksClient = jwksRsa({
        jwksUri: `https://cognito-idp.${region}.amazonaws.com/${userPoolId}/.well-known/jwks.json`,
        cache: true,
        rateLimit: true,
      });

      const getSigningKeyPromise = () =>
        new Promise<string>((resolve, reject) => {
          jwksClient.getSigningKey(kid, (err, key) => {
            if (err) {
              reject(err);
            } else {
              resolve(key?.getPublicKey() || '');
            }
          });
        });

      const publicKey = await getSigningKeyPromise();
      const verified = jwt.verify(token, publicKey, { algorithms: ['RS256'] }) as any;

      return {
        sub: verified.sub,
        email: verified.email || verified.username,
        role: (verified['custom:role'] || 'USER') as any,
        planType: (verified['custom:planType'] || 'FREE') as any,
      };
    }

    // Fallback to local JWT verification (HS256)
    const verified = jwt.verify(token, this.SECRET) as any;
    return {
      sub: verified.sub,
      email: verified.email,
      role: verified.role,
      planType: verified.planType,
    };
  }
}
