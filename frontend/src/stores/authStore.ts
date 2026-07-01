import { create } from 'zustand';
import type { AuthState, AuthStatus } from '../types/auth';
import type { UserProfile } from '../types/profile';
import { tokenManager } from '../services/api/tokenManager';

interface AuthActions {
  setAuthStatus: (status: AuthStatus) => void;
  setAuthUser: (user: UserProfile | null) => void;
  setAuthError: (error: string | null) => void;
  loginSuccess: (user: UserProfile, expiry?: string) => void;
  logout: () => void;
  clearAuthError: () => void;
  setMfaRequired: (required: boolean, mfaSession?: string | null) => void;
  setInitialized: (initialized: boolean) => void;
  setLoading: (loading: boolean) => void;
}

type AuthStoreState = AuthState & AuthActions;

export const useAuthStore = create<AuthStoreState>((set) => ({
  isAuthenticated: false,
  status: 'idle',
  user: null,
  error: null,
  sessionExpiry: null,
  mfaRequired: false,
  mfaSession: null,
  token: null,
  loading: false,
  initialized: false,

  setAuthStatus: (status) => set({ status, loading: status === 'loading' }),
  setAuthUser: (user) => set({ user, isAuthenticated: !!user }),
  setAuthError: (error) => set({ error, status: error ? 'error' : 'idle', loading: false }),
  loginSuccess: (user, expiry) =>
    set({
      user,
      isAuthenticated: true,
      status: 'success',
      error: null,
      sessionExpiry: expiry || new Date(Date.now() + 3600 * 1000).toISOString(),
      mfaRequired: false,
      mfaSession: null,
      token: tokenManager.getAccessToken(),
      loading: false
    }),
  logout: () =>
    set({
      user: null,
      isAuthenticated: false,
      status: 'idle',
      error: null,
      sessionExpiry: null,
      mfaRequired: false,
      mfaSession: null,
      token: null,
      loading: false
    }),
  clearAuthError: () => set({ error: null, status: 'idle' }),
  setMfaRequired: (required, mfaSession = null) =>
    set({
      mfaRequired: required,
      mfaSession,
      status: required ? 'idle' : 'success'
    }),
  setInitialized: (initialized) => set({ initialized }),
  setLoading: (loading) => set({ loading, status: loading ? 'loading' : 'idle' })
}));
