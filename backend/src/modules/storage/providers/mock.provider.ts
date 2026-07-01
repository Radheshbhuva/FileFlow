import {
  StorageProvider,
  UploadResult,
  DownloadResult,
  StorageObjectMetadata,
} from '../interfaces/storage-provider.interface';
import { v4 as uuidv4 } from 'uuid';

export class MockStorageProvider implements StorageProvider {
  private bucket: Map<
    string,
    {
      buffer: Buffer;
      mimeType: string;
      metadata?: Record<string, string>;
      eTag: string;
      timestamp: Date;
    }
  > = new Map();

  private multipartUploads: Map<
    string,
    {
      key: string;
      mimeType: string;
      parts: Array<{ partNumber: number; body: Buffer; eTag: string }>;
    }
  > = new Map();

  public async upload(
    key: string,
    fileBuffer: Buffer,
    mimeType: string,
    metadata?: Record<string, string>
  ): Promise<UploadResult> {
    const eTag = `"${uuidv4().replace(/-/g, '')}"`;
    const timestamp = new Date();

    this.bucket.set(key, {
      buffer: fileBuffer,
      mimeType,
      metadata,
      eTag,
      timestamp,
    });

    return {
      key,
      eTag,
      size: fileBuffer.length,
      contentType: mimeType,
      timestamp,
    };
  }

  public async download(key: string): Promise<DownloadResult> {
    const item = this.bucket.get(key);
    if (!item) {
      throw new Error(`NoSuchKey: The specified key does not exist in storage: ${key}`);
    }

    return {
      fileBuffer: item.buffer,
      contentType: item.mimeType,
      size: item.buffer.length,
    };
  }

  public async delete(key: string): Promise<void> {
    if (!this.bucket.has(key)) {
      throw new Error(`NoSuchKey: The specified key does not exist in storage: ${key}`);
    }
    this.bucket.delete(key);
  }

  public async copy(sourceKey: string, destKey: string): Promise<void> {
    const item = this.bucket.get(sourceKey);
    if (!item) {
      throw new Error(`NoSuchKey: Source key does not exist: ${sourceKey}`);
    }

    this.bucket.set(destKey, {
      buffer: Buffer.from(item.buffer),
      mimeType: item.mimeType,
      metadata: item.metadata ? { ...item.metadata } : undefined,
      eTag: `"${uuidv4().replace(/-/g, '')}"`,
      timestamp: new Date(),
    });
  }

  public async move(sourceKey: string, destKey: string): Promise<void> {
    await this.copy(sourceKey, destKey);
    await this.delete(sourceKey);
  }

  public async rename(sourceKey: string, destKey: string): Promise<void> {
    await this.move(sourceKey, destKey);
  }

  public async generatePresignedUrl(
    key: string,
    operation: 'upload' | 'download',
    expiresInSeconds: number
  ): Promise<string> {
    const signature = `mock-signature-${uuidv4().substring(0, 8)}`;
    if (process.env.NODE_ENV === 'test') {
      const host = 'https://fileflow-storage-dev.s3.us-east-1.amazonaws.com';
      return `${host}/${key}?operation=${operation}&expires=${expiresInSeconds}&sig=${signature}`;
    }
    const port = process.env.PORT || '5000';
    const host = process.env.BACKEND_API_URL || `http://localhost:${port}/api/v1`;
    return `${host}/storage/mock-s3/${key}?operation=${operation}&expires=${expiresInSeconds}&sig=${signature}`;
  }

  public async generateUploadUrl(key: string, expiresInSeconds: number): Promise<string> {
    return this.generatePresignedUrl(key, 'upload', expiresInSeconds);
  }

  public async generateDownloadUrl(key: string, expiresInSeconds: number): Promise<string> {
    return this.generatePresignedUrl(key, 'download', expiresInSeconds);
  }

  public async exists(key: string): Promise<boolean> {
    return this.bucket.has(key);
  }

  public async getMetadata(key: string): Promise<StorageObjectMetadata> {
    const item = this.bucket.get(key);
    if (!item) {
      throw new Error(`NoSuchKey: Key not found: ${key}`);
    }

    return {
      key,
      eTag: item.eTag,
      size: item.buffer.length,
      contentType: item.mimeType,
      timestamp: item.timestamp,
      customMetadata: item.metadata,
    };
  }

  // =========================================================================
  // Multipart Upload Mock Implementation
  // =========================================================================

  public async initiateMultipartUpload(key: string, mimeType: string): Promise<string> {
    const uploadId = uuidv4().replace(/-/g, '');
    this.multipartUploads.set(uploadId, {
      key,
      mimeType,
      parts: [],
    });
    return uploadId;
  }

  public async uploadPart(
    key: string,
    uploadId: string,
    partNumber: number,
    body: Buffer
  ): Promise<{ ETag: string; PartNumber: number }> {
    const session = this.multipartUploads.get(uploadId);
    if (!session) {
      throw new Error(`NoSuchUpload: The upload ID ${uploadId} does not exist.`);
    }

    const eTag = `"${uuidv4().replace(/-/g, '')}"`;
    session.parts.push({
      partNumber,
      body,
      eTag,
    });

    return {
      ETag: eTag,
      PartNumber: partNumber,
    };
  }

  public async completeMultipartUpload(
    key: string,
    uploadId: string,
    parts: Array<{ ETag: string; PartNumber: number }>
  ): Promise<UploadResult> {
    const session = this.multipartUploads.get(uploadId);
    if (!session) {
      throw new Error(`NoSuchUpload: The upload ID ${uploadId} does not exist.`);
    }

    const sortedParts = [...session.parts].sort((a, b) => a.partNumber - b.partNumber);
    const bufferList = sortedParts.map((p) => p.body);
    const combinedBuffer = Buffer.concat(bufferList);

    this.multipartUploads.delete(uploadId);

    return this.upload(key, combinedBuffer, session.mimeType);
  }

  public async abortMultipartUpload(key: string, uploadId: string): Promise<void> {
    if (!this.multipartUploads.has(uploadId)) {
      throw new Error(`NoSuchUpload: The upload ID ${uploadId} does not exist.`);
    }
    this.multipartUploads.delete(uploadId);
  }
}
