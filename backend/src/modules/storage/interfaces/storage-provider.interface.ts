export interface UploadResult {
  key: string;
  eTag?: string;
  size: number;
  contentType: string;
  timestamp: Date;
}

export interface DownloadResult {
  fileBuffer: Buffer;
  contentType: string;
  size: number;
}

export interface StorageObjectMetadata {
  key: string;
  eTag?: string;
  size: number;
  contentType: string;
  timestamp: Date;
  customMetadata?: Record<string, string>;
}

export interface StorageProvider {
  /**
   * Uploads a single file buffer to storage.
   */
  upload(
    key: string,
    fileBuffer: Buffer,
    mimeType: string,
    metadata?: Record<string, string>
  ): Promise<UploadResult>;

  /**
   * Downloads a file from storage.
   */
  download(key: string): Promise<DownloadResult>;

  /**
   * Deletes a file from storage.
   */
  delete(key: string): Promise<void>;

  /**
   * Copies an object inside the storage bucket from sourceKey to destKey.
   */
  copy(sourceKey: string, destKey: string): Promise<void>;

  /**
   * Moves/renames an object inside the storage bucket from sourceKey to destKey.
   */
  move(sourceKey: string, destKey: string): Promise<void>;

  /**
   * Renames an object in the storage bucket.
   */
  rename(sourceKey: string, destKey: string): Promise<void>;

  /**
   * Generates a short-lived presigned URL for upload or download operations.
   */
  generatePresignedUrl(
    key: string,
    operation: 'upload' | 'download',
    expiresInSeconds: number
  ): Promise<string>;

  /**
   * Generates a short-lived presigned URL for upload operations.
   */
  generateUploadUrl(key: string, expiresInSeconds: number): Promise<string>;

  /**
   * Generates a short-lived presigned URL for download operations.
   */
  generateDownloadUrl(key: string, expiresInSeconds: number): Promise<string>;

  /**
   * Checks if an object exists in storage.
   */
  exists(key: string): Promise<boolean>;

  /**
   * Retrieves an object's metadata from storage.
   */
  getMetadata(key: string): Promise<StorageObjectMetadata>;

  // =========================================================================
  // Multipart Upload (Chunking & Large Files preparation stubs)
  // =========================================================================

  /**
   * Initiates a multi-part upload session. Returns an upload transaction ID.
   */
  initiateMultipartUpload(key: string, mimeType: string): Promise<string>;

  /**
   * Uploads a single part/chunk of a larger file.
   */
  uploadPart(
    key: string,
    uploadId: string,
    partNumber: number,
    body: Buffer
  ): Promise<{ ETag: string; PartNumber: number }>;

  /**
   * Finalizes and merges all uploaded parts to complete the file upload.
   */
  completeMultipartUpload(
    key: string,
    uploadId: string,
    parts: Array<{ ETag: string; PartNumber: number }>
  ): Promise<UploadResult>;

  /**
   * Aborts the multi-part upload session and discards uploaded parts.
   */
  abortMultipartUpload(key: string, uploadId: string): Promise<void>;
}
