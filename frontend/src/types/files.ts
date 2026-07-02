export type FileType = 'pdf' | 'image' | 'spreadsheet' | 'document' | 'archive' | 'text' | 'other';
export type FileStatus = 'ready' | 'processing' | 'failed';
export type SecurityLabel = 'Secure' | 'Good' | 'Warning' | 'Risk';
export type SharedStatus = 'public' | 'team' | 'private';

export interface FileSecurity {
  score: number;
  label: SecurityLabel;
  factors: string[];
  isEncrypted: boolean;
}

export interface FileOwner {
  id: string;
  name: string;
  avatarUrl?: string;
  initials: string;
}

export interface File {
  id: string;
  name: string;
  type: FileType;
  extension: string;
  sizeBytes: number;
  sizeLabel: string;
  owner: FileOwner;
  uploadDate: string;
  lastModified: string;
  downloadCount: number;
  shareCount: number;
  security: FileSecurity;
  status: FileStatus;
  tags: string[];
  sharedStatus: SharedStatus;
  expiryDate?: string;
  previewUrl?: string;
  isFavorite?: boolean;
}

export interface FileInsights {
  mostDownloaded: File | null;
  recentlyShared: File | null;
  largestFile: File | null;
  unusedFilesCount: number;
  storageConsumedBytes: number;
  storageMaxBytes: number;
  recentUploadCount: number;
}

export interface FileActivity {
  id: string;
  fileId: string;
  fileName: string;
  action: 'uploaded' | 'downloaded' | 'shared' | 'renamed' | 'deleted' | 'archived';
  user: string;
  timestamp: string;
  relativeTime: string;
}

export interface FileFilter {
  type?: FileType[];
  dateRange?: { start?: string; end?: string };
  minSize?: number;
  maxSize?: number;
  owner?: string[];
  status?: FileStatus[];
  minSecurityScore?: number;
  maxSecurityScore?: number;
  sharedStatus?: SharedStatus[];
  recentlyModified?: boolean;
  isFavorite?: boolean;
}
