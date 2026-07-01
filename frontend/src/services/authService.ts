import type { UserProfile } from '../types/profile';
import { useAuthStore } from '../stores/authStore';
import { useProfileStore } from '../stores/profileStore';
import { authApi } from './api/authApi';
import { tokenManager } from './api/tokenManager';

export const mapBackendUserToUserProfile = (user: any): UserProfile => {
  const planTypeMap: Record<string, 'Free' | 'Professional' | 'Enterprise'> = {
    'FREE': 'Free',
    'PRO': 'Professional',
    'ENTERPRISE': 'Enterprise',
    'Free': 'Free',
    'Professional': 'Professional',
    'Enterprise': 'Enterprise'
  };
  const mappedPlanType = planTypeMap[user.planType] || 'Free';

  const roleMap: Record<string, string> = {
    'USER': 'Member',
    'ADMIN': 'Administrator',
    'OWNER': 'Owner'
  };
  const mappedRole = roleMap[user.role] || user.role || 'Member';

  const statusMap: Record<string, 'active' | 'suspended' | 'pending'> = {
    'ACTIVE': 'active',
    'SUSPENDED': 'suspended',
    'PENDING_VERIFICATION': 'pending'
  };
  const mappedStatus = statusMap[user.accountStatus] || 'active';

  const initials = user.fullName
    ? user.fullName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
    : 'NU';

  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    avatar: user.avatar || '',
    role: mappedRole,
    createdAt: user.createdAt,
    lastLogin: user.lastLogin || new Date().toISOString(),
    accountStatus: mappedStatus,
    emailVerified: !!user.emailVerified,
    storageUsed: user.storageUsed || 0,
    storageLimit: user.storageLimit || 5 * 1024 * 1024 * 1024,
    planType: mappedPlanType,
    plan: mappedPlanType,
    accountCreated: new Date(user.createdAt).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }),
    avatarInitials: initials
  };
};

export const authService = {
  /**
   * Real backend registration
   */
  register: async (payload: { fullName: string; email: string; password?: string; confirmPassword?: string; planType?: string }): Promise<any> => {
    const res = await authApi.register(payload);
    // Return data.user which contains verificationToken and details
    return res.data?.user || res.data;
  },

  /**
   * Real login connecting to Express JWT endpoints
   */
  login: async (email: string, password: string): Promise<UserProfile> => {
    const res = await authApi.login({ email, password });
    const { token, user } = res.data;

    const profile = mapBackendUserToUserProfile(user);

    // Save tokens and profile in tokenManager (localStorage)
    tokenManager.setAccessToken(token);
    tokenManager.setUser(profile);

    // Sync Zustand stores
    useAuthStore.getState().loginSuccess(profile);
    useProfileStore.getState().updateProfile(profile);

    return profile;
  },

  /**
   * Clears tokens and auth store locally, and optionally notifies backend
   */
  logout: async (): Promise<void> => {
    try {
      await authApi.logout();
    } catch {
      // Ignore network errors on logout to ensure user always gets logged out client-side
    }

    // Clear local storage and Zustand stores
    tokenManager.clear();
    useAuthStore.getState().logout();
    useProfileStore.getState().resetProfile();
  },

  /**
   * Verifies verification token with backend
   */
  verifyEmail: async (token: string): Promise<UserProfile> => {
    const res = await authApi.verifyEmail(token);
    return mapBackendUserToUserProfile(res.data?.user || res.data);
  },

  /**
   * Forgot password flow
   */
  forgotPassword: async (email: string): Promise<any> => {
    const res = await authApi.forgotPassword(email);
    return res.data || res;
  },

  /**
   * Reset password flow
   */
  resetPassword: async (payload: any): Promise<void> => {
    await authApi.resetPassword(payload);
  },

  /**
   * Hydrates session on reload using /auth/me
   */
  rememberSession: async (): Promise<UserProfile | null> => {
    const token = tokenManager.getAccessToken();
    if (!token) {
      return null;
    }

    try {
      const res = await authApi.getMe();
      const user = res.data?.user || res.data;
      if (!user) {
        throw new Error('User not found in profile payload');
      }

      const profile = mapBackendUserToUserProfile(user);

      // Hydrate state
      tokenManager.setUser(profile);
      useAuthStore.getState().loginSuccess(profile);
      useProfileStore.getState().updateProfile(profile);

      return profile;
    } catch (e) {
      // Clear expired / invalid session
      tokenManager.clear();
      useAuthStore.getState().logout();
      useProfileStore.getState().resetProfile();
      return null;
    }
  },

  /**
   * Retrieves current user from state
   */
  getCurrentUser: (): UserProfile | null => {
    return useAuthStore.getState().user;
  },

  /**
   * Token refresh placeholder (not fully implemented in backend yet, stubbed for future)
   */
  refreshSession: async (): Promise<void> => {
    // Stub for future Cognito/OAuth refresh token integration
    return Promise.resolve();
  }
};
