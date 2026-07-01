import type { UserProfile } from './profile';

export type AuthStatus = 'idle' | 'loading' | 'success' | 'error' | 'locked' | 'unverified';

export interface AuthState {
  isAuthenticated: boolean;
  status: AuthStatus;
  user: UserProfile | null;
  error: string | null;
  sessionExpiry: string | null;
  mfaRequired: boolean;
  mfaSession: string | null;
  token: string | null;
  loading: boolean;
  initialized: boolean;
}

export interface SocialAuthFeatureFlags {
  googleEnabled: boolean;
  githubEnabled: boolean;
  microsoftEnabled: boolean;
  ssoEnabled: boolean;
}

export interface SessionInfo {
  accessToken: string;
  idToken: string;
  refreshToken: string;
  expiresIn: number;
}
