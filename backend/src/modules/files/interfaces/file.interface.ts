export type FileStatus = 'ACTIVE' | 'ARCHIVED' | 'DELETED';
export type ShareStatus = 'PRIVATE' | 'SHARED';

export interface File {
  id: string;
  ownerId: string;
  fileName: string;
  originalName: string;
  fileType: string;
  mimeType: string;
  fileSize: number;
  storagePath: string;
  securityScore: number;
  favorite: boolean;
  status: FileStatus;
  shareStatus: ShareStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListFilesFilters {
  search?: string;
  fileType?: string;
  favorite?: boolean;
  status?: FileStatus;
  shareStatus?: ShareStatus;
  minSecurityScore?: number;
  startDate?: Date;
  endDate?: Date;
}

export interface ListFilesPagination {
  page: number;
  limit: number;
}

export interface ListFilesSort {
  sortBy: 'fileName' | 'fileSize' | 'createdAt' | 'securityScore';
  sortOrder: 'asc' | 'desc';
}

export interface FileRepository {
  create(file: Omit<File, 'id' | 'createdAt' | 'updatedAt'>): Promise<File>;
  findById(id: string): Promise<File | null>;
  update(id: string, updates: Partial<File>): Promise<File>;
  delete(id: string): Promise<boolean>;
  findAll(
    ownerId: string,
    filters: ListFilesFilters,
    pagination: ListFilesPagination,
    sort: ListFilesSort
  ): Promise<{ files: File[]; total: number }>;
  findInsights(ownerId: string): Promise<{
    mostDownloaded: File[];
    mostShared: File[];
    largestFiles: File[];
    leastUsedFiles: File[];
    recentFiles: File[];
  }>;
}
