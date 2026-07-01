export type UserRole = 'USER' | 'ADMIN' | 'OWNER';
export type PlanType = 'FREE' | 'PRO' | 'ENTERPRISE';
export type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION';

export interface User {
  id: string;
  fullName: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  planType: PlanType;
  emailVerified: boolean;
  accountStatus: AccountStatus;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  storageUsed: number; // in bytes
  storageLimit: number; // in bytes
  
  // Profile Information Placeholders
  avatar?: string;
  timezone?: string;
  company?: string;
  jobTitle?: string;

  // Activity Summary Metrics
  filesUploadedCount?: number;
  filesSharedCount?: number;
  favoritesCount?: number;
  recentActivityCount?: number;

  // Verification & Reset Tokens
  verificationToken?: string;
  verificationTokenExpiresAt?: Date;
  resetPasswordToken?: string;
  resetPasswordExpiresAt?: Date;

  // AWS Cognito Sync Field
  cognitoSub?: string;
}

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByVerificationToken(token: string): Promise<User | null>;
  findByResetToken(token: string): Promise<User | null>;
  create(user: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'storageUsed' | 'storageLimit'>): Promise<User>;
  update(id: string, updates: Partial<User>): Promise<User>;
  delete(id: string): Promise<boolean>;
}
