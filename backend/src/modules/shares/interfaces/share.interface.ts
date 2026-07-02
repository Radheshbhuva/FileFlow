export type AccessLevel = 'VIEW' | 'DOWNLOAD' | 'EDIT' | 'FULL_ACCESS';
export type ShareStatus = 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'DISABLED';

export interface Share {
  id: string;
  fileId: string;
  ownerId: string;
  shareLink: string;
  shareToken: string;
  accessLevel: AccessLevel;
  shareStatus: ShareStatus;
  downloadCount: number;
  maxDownloads?: number;
  expiryDate?: Date;
  passwordProtected: boolean;
  passwordHash?: string;
  sharedWith?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShareRepository {
  create(share: Omit<Share, 'id' | 'createdAt' | 'updatedAt' | 'downloadCount'>): Promise<Share>;
  findById(id: string): Promise<Share | null>;
  findByToken(token: string): Promise<Share | null>;
  update(id: string, updates: Partial<Share>): Promise<Share>;
  delete(id: string): Promise<boolean>;
  findAll(ownerId: string): Promise<Share[]>;
  findActiveByFileId(fileId: string): Promise<Share[]>;
  getAnalytics(ownerId: string): Promise<{
    totalShares: number;
    activeShares: number;
    expiredShares: number;
    revokedShares: number;
    mostDownloadedFiles: Array<{ fileId: string; fileName: string; downloadCount: number }>;
    mostSharedFiles: Array<{ fileId: string; fileName: string; shareCount: number }>;
  }>;
}
