import { create } from 'zustand';
import type { UserProfile } from '../types/profile';

interface ProfileState {
  user: UserProfile;
  isLoading: boolean;
  error: string | null;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateProfile: (fields: Partial<UserProfile>) => void;
  resetProfile: () => void;
}

const getInitials = (name: string): string => {
  const parts = name.trim().split(' ');
  return parts
    .map((p) => p[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

export const INITIAL_PROFILE: UserProfile = {
  id: 'usr_01',
  fullName: 'Alex Morgan',
  email: 'alex.morgan@fileflow.io',
  avatar: '',
  role: 'Administrator',
  createdAt: 'March 12, 2025',
  lastLogin: 'Today at 9:42 AM',
  accountStatus: 'active',
  emailVerified: true,
  storageUsed: 220 * 1024 * 1024, // 220 MB
  storageLimit: 5 * 1024 * 1024 * 1024, // 5 GB
  planType: 'Professional',
  
  // Compatibility fields for legacy usage
  plan: 'Professional',
  accountCreated: 'March 12, 2025',
  avatarInitials: 'AM'
};

export const useProfileStore = create<ProfileState>((set) => ({
  user: INITIAL_PROFILE,
  isLoading: false,
  error: null,
  
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  updateProfile: (fields) =>
    set((state) => {
      const updatedUser = { ...state.user, ...fields };
      
      // Update plan property and storage limit if planType is updated
      if (fields.planType) {
        updatedUser.plan = fields.planType;
        updatedUser.storageLimit = fields.planType === 'Enterprise' ? 50 * 1024 * 1024 * 1024 : fields.planType === 'Professional' ? 5 * 1024 * 1024 * 1024 : 500 * 1024 * 1024;
      }
      
      // Update planType and storage limit if legacy plan is updated
      if (fields.plan) {
        updatedUser.planType = fields.plan as any;
        updatedUser.storageLimit = fields.plan === 'Enterprise' ? 50 * 1024 * 1024 * 1024 : fields.plan === 'Professional' ? 5 * 1024 * 1024 * 1024 : 500 * 1024 * 1024;
      }

      // Recompute initials if fullName changes
      if (fields.fullName) {
        updatedUser.avatarInitials = getInitials(fields.fullName);
      }
      
      return { user: updatedUser };
    }),

  resetProfile: () => set({ user: INITIAL_PROFILE, isLoading: false, error: null })
}));

