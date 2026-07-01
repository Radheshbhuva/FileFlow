import {
  StorageProvider,
  UploadResult,
  DownloadResult,
  StorageObjectMetadata,
} from '../interfaces/storage-provider.interface';
import { S3StorageProvider } from '../providers/s3.provider';
import { MockStorageProvider } from '../providers/mock.provider';

export class StorageService {
  private provider: StorageProvider;

  constructor(provider?: StorageProvider) {
    if (provider) {
      this.provider = provider;
    } else {
      const useMock =
        process.env.NODE_ENV === 'test' ||
        !process.env.AWS_ACCESS_KEY_ID ||
        process.env.AWS_ACCESS_KEY_ID === 'AKIAIOSFODNN7EXAMPLE';
      this.provider = useMock ? new MockStorageProvider() : new S3StorageProvider();
    }
  }

  public async uploadFile(
    key: string,
    fileBuffer: Buffer,
    mimeType: string,
    metadata?: Record<string, string>
  ): Promise<UploadResult> {
    return this.provider.upload(key, fileBuffer, mimeType, metadata);
  }

  public async downloadFile(key: string): Promise<DownloadResult> {
    return this.provider.download(key);
  }

  public async deleteFile(key: string): Promise<void> {
    return this.provider.delete(key);
  }

  public async copyFile(sourceKey: string, destKey: string): Promise<void> {
    return this.provider.copy(sourceKey, destKey);
  }

  public async moveFile(sourceKey: string, destKey: string): Promise<void> {
    return this.provider.move(sourceKey, destKey);
  }

  public async renameFile(sourceKey: string, destKey: string): Promise<void> {
    return this.provider.rename(sourceKey, destKey);
  }

  public async exists(key: string): Promise<boolean> {
    return this.provider.exists(key);
  }

  public async getFileMetadata(key: string): Promise<StorageObjectMetadata> {
    return this.provider.getMetadata(key);
  }

  public async getMetadata(key: string): Promise<StorageObjectMetadata> {
    return this.provider.getMetadata(key);
  }

  public async generateUploadUrl(
    key: string,
    expiresInSeconds = 900 // Default 15 minutes
  ): Promise<string> {
    return this.provider.generatePresignedUrl(key, 'upload', expiresInSeconds);
  }

  public async generateDownloadUrl(
    key: string,
    expiresInSeconds = 900 // Default 15 minutes
  ): Promise<string> {
    return this.provider.generatePresignedUrl(key, 'download', expiresInSeconds);
  }

  // =========================================================================
  // Multipart Upload Service Methods
  // =========================================================================

  public async initiateMultipartUpload(key: string, mimeType: string): Promise<string> {
    return this.provider.initiateMultipartUpload(key, mimeType);
  }

  public async uploadPart(
    key: string,
    uploadId: string,
    partNumber: number,
    body: Buffer
  ): Promise<{ ETag: string; PartNumber: number }> {
    return this.provider.uploadPart(key, uploadId, partNumber, body);
  }

  public async completeMultipartUpload(
    key: string,
    uploadId: string,
    parts: Array<{ ETag: string; PartNumber: number }>
  ): Promise<UploadResult> {
    return this.provider.completeMultipartUpload(key, uploadId, parts);
  }

  public async abortMultipartUpload(key: string, uploadId: string): Promise<void> {
    return this.provider.abortMultipartUpload(key, uploadId);
  }
}
