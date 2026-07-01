import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  CopyObjectCommand,
  HeadObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  StorageProvider,
  UploadResult,
  DownloadResult,
  StorageObjectMetadata,
} from '../interfaces/storage-provider.interface';

export class S3StorageProvider implements StorageProvider {
  private s3Client: S3Client;
  private bucketName: string;

  constructor(
    s3Client?: S3Client,
    bucketName?: string
  ) {
    this.bucketName = bucketName || process.env.AWS_S3_BUCKET_NAME || 'fileflow-storage-dev';
    this.s3Client =
      s3Client ||
      new S3Client({
        region: process.env.AWS_REGION || 'us-east-1',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'AKIAIOSFODNN7EXAMPLE',
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'mockSecretAccessKey',
        },
      });
  }

  public async upload(
    key: string,
    fileBuffer: Buffer,
    mimeType: string,
    metadata?: Record<string, string>
  ): Promise<UploadResult> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: fileBuffer,
      ContentType: mimeType,
      Metadata: metadata,
    });

    const response = await this.s3Client.send(command);
    return {
      key,
      eTag: response.ETag,
      size: fileBuffer.length,
      contentType: mimeType,
      timestamp: new Date(),
    };
  }

  public async download(key: string): Promise<DownloadResult> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    const response = await this.s3Client.send(command);
    if (!response.Body) {
      throw new Error(`GetObject: Empty response body returned for ${key}`);
    }

    const bytes = await response.Body.transformToByteArray();
    const fileBuffer = Buffer.from(bytes);

    return {
      fileBuffer,
      contentType: response.ContentType || 'application/octet-stream',
      size: response.ContentLength || fileBuffer.length,
    };
  }

  public async delete(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });
    await this.s3Client.send(command);
  }

  public async copy(sourceKey: string, destKey: string): Promise<void> {
    const command = new CopyObjectCommand({
      Bucket: this.bucketName,
      CopySource: encodeURIComponent(`${this.bucketName}/${sourceKey}`),
      Key: destKey,
    });
    await this.s3Client.send(command);
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
    let command;
    if (operation === 'upload') {
      command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
    } else {
      command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
    }

    return getSignedUrl(this.s3Client, command, { expiresIn: expiresInSeconds });
  }

  public async generateUploadUrl(key: string, expiresInSeconds: number): Promise<string> {
    return this.generatePresignedUrl(key, 'upload', expiresInSeconds);
  }

  public async generateDownloadUrl(key: string, expiresInSeconds: number): Promise<string> {
    return this.generatePresignedUrl(key, 'download', expiresInSeconds);
  }

  public async exists(key: string): Promise<boolean> {
    try {
      await this.getMetadata(key);
      return true;
    } catch (error: any) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        return false;
      }
      throw error;
    }
  }

  public async getMetadata(key: string): Promise<StorageObjectMetadata> {
    const command = new HeadObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    const response = await this.s3Client.send(command);
    return {
      key,
      eTag: response.ETag,
      size: response.ContentLength || 0,
      contentType: response.ContentType || 'application/octet-stream',
      timestamp: response.LastModified || new Date(),
      customMetadata: response.Metadata,
    };
  }

  // =========================================================================
  // Multipart Upload S3 SDK Implementation
  // =========================================================================

  public async initiateMultipartUpload(key: string, mimeType: string): Promise<string> {
    const command = new CreateMultipartUploadCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: mimeType,
    });
    const response = await this.s3Client.send(command);
    if (!response.UploadId) {
      throw new Error(`CreateMultipartUpload: Failed to retrieve UploadId for ${key}`);
    }
    return response.UploadId;
  }

  public async uploadPart(
    key: string,
    uploadId: string,
    partNumber: number,
    body: Buffer
  ): Promise<{ ETag: string; PartNumber: number }> {
    const command = new UploadPartCommand({
      Bucket: this.bucketName,
      Key: key,
      UploadId: uploadId,
      PartNumber: partNumber,
      Body: body,
    });
    const response = await this.s3Client.send(command);
    if (!response.ETag) {
      throw new Error(`UploadPart: Failed to upload part ${partNumber} for ${key}`);
    }
    return {
      ETag: response.ETag,
      PartNumber: partNumber,
    };
  }

  public async completeMultipartUpload(
    key: string,
    uploadId: string,
    parts: Array<{ ETag: string; PartNumber: number }>
  ): Promise<UploadResult> {
    const command = new CompleteMultipartUploadCommand({
      Bucket: this.bucketName,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: parts,
      },
    });
    const response = await this.s3Client.send(command);
    const meta = await this.getMetadata(key);
    return {
      key,
      eTag: response.ETag,
      size: meta.size,
      contentType: meta.contentType,
      timestamp: meta.timestamp,
    };
  }

  public async abortMultipartUpload(key: string, uploadId: string): Promise<void> {
    const command = new AbortMultipartUploadCommand({
      Bucket: this.bucketName,
      Key: key,
      UploadId: uploadId,
    });
    await this.s3Client.send(command);
  }
}
