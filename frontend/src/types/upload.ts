import type { FileType } from './files';

export type UploadStatus = 'pending' | 'uploading' | 'completed' | 'failed' | 'cancelled';

export interface UploadFile {
  id: string;
  name: string;
  sizeBytes: number;
  sizeLabel: string;
  type: FileType;
  extension: string;
  securityScore: number;
  isEncrypted: boolean;
  lastModified: string;
}

export interface UploadQueueItem {
  id: string;
  file: UploadFile;
  progress: number; // 0 to 100
  status: UploadStatus;
  speedBytesPerSecond?: number;
  estimatedSecondsRemaining?: number;
  error?: string;
  backendUploadId?: string;
}

export interface ValidationError {
  id: string;
  fileName: string;
  message: string;
  suggestedFix: string;
  code: 'size_limit' | 'unsupported_type' | 'duplicate' | 'corrupted';
}

export interface UploadSummary {
  filesUploaded: number;
  filesFailed: number;
  totalSizeUploadedBytes: number;
  totalDurationSeconds: number;
  successRate: number;
}

export interface UploadAnalytics {
  filesSelected: number;
  totalUploadSizeBytes: number;
  averageFileSizeBytes: number;
  uploadSuccessRate: number;
  mostCommonFileType: string;
  largestFile: UploadFile | null;
}
