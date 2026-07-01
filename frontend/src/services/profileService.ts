import apiClient from './api/apiClient';
import { mapBackendUserToUserProfile } from './authService';
import type { UserProfile } from '../types/profile';

export const profileService = {
  /**
   * Updates standard profile details on the backend
   */
  updateProfile: async (dto: { fullName?: string; timezone?: string; company?: string; jobTitle?: string }): Promise<UserProfile> => {
    const res = await apiClient.put('/users/profile', dto);
    const rawUser = res.data.data.user;
    return mapBackendUserToUserProfile(rawUser);
  },

  /**
   * Updates user avatar URL on the backend
   */
  updateAvatar: async (avatarUrl: string): Promise<UserProfile> => {
    const res = await apiClient.put('/users/avatar', { avatar: avatarUrl });
    const rawUser = res.data.data.user;
    return mapBackendUserToUserProfile(rawUser);
  },

  /**
   * Submits password modification request
   */
  changePassword: async (dto: { currentPassword: string; newPassword: string; confirmPassword: string }): Promise<void> => {
    await apiClient.put('/users/change-password', dto);
  }
};
