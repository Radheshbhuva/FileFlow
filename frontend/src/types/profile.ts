export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  avatar?: string;
  role: string;
  createdAt: string;
  lastLogin: string;
  accountStatus: 'active' | 'suspended' | 'pending';
  emailVerified: boolean;
  storageUsed: number;
  storageLimit: number;
  planType: 'Free' | 'Professional' | 'Enterprise';
  
  // Backward compatibility fields for pages and layouts
  plan: string;
  accountCreated: string;
  avatarInitials: string;
}
