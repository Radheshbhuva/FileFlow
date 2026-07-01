export type UploadStatus = 'PENDING' | 'QUEUED' | 'UPLOADING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
export type UploadMethod = 'STANDARD' | 'MULTIPART' | 'CHUNKED';

export interface Upload {
  id: string;
  userId: string;
  fileId?: string;
  uploadStatus: UploadStatus;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadProgress: number;
  uploadMethod: UploadMethod;
  startedAt: Date;
  completedAt?: Date;
  failedAt?: Date;
  errorMessage?: string;
  createdAt: Date;
}

export interface UploadRepository {
  create(upload: Omit<Upload, 'id' | 'createdAt'>): Promise<Upload>;
  findById(id: string): Promise<Upload | null>;
  update(id: string, updates: Partial<Upload>): Promise<Upload>;
  delete(id: string): Promise<boolean>;
  findAll(userId: string): Promise<Upload[]>;
  findHistory(userId: string, limit?: number): Promise<Upload[]>;
  getAnalytics(userId: string): Promise<{
    totalUploads: number;
    successRate: number;
    failureRate: number;
    averageUploadSize: number;
    largestUpload: number;
    recentUploadCount: number;
  }>;
}
