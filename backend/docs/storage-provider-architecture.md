# Storage Provider Architecture

The Storage Layer in FileFlow is designed as a decoupled abstraction to ensure that backend modules are completely isolated from specific cloud storage provider SDK structures.

```
                          ┌────────────────────────┐
                          │   StorageController    │
                          └───────────┬────────────┘
                                      │
                          ┌───────────▼────────────┐
                          │     StorageService     │
                          └───────────┬────────────┘
                                      │ (implements)
                          ┌───────────▼────────────┐
                          │   «StorageProvider»    │
                          └────┬──────────────┬────┘
                               │              │
                               ▼              ▼
                     ┌───────────┐      ┌───────────┐
                     │S3Provider │      │MockProvide│
                     └───────────┘      └───────────┘
```

## 1. StorageProvider Interface Contract

The `StorageProvider` interface contract enforces standard operations:

```typescript
export interface StorageProvider {
  upload(key: string, fileBuffer: Buffer, mimeType: string, metadata?: Record<string, string>): Promise<UploadResult>;
  download(key: string): Promise<DownloadResult>;
  delete(key: string): Promise<void>;
  copy(sourceKey: string, destKey: string): Promise<void>;
  move(sourceKey: string, destKey: string): Promise<void>;
  rename(sourceKey: string, destKey: string): Promise<void>;
  generatePresignedUrl(key: string, operation: 'upload' | 'download', expiresIn: number): Promise<string>;
  generateUploadUrl(key: string, expiresInSeconds: number): Promise<string>;
  generateDownloadUrl(key: string, expiresInSeconds: number): Promise<string>;
  exists(key: string): Promise<boolean>;
  getMetadata(key: string): Promise<StorageObjectMetadata>;
}
```

## 2. Dynamic Provider Switching (Test Fallback)

By default, the `StorageService` initiates the `S3StorageProvider`. However, to facilitate seamless local testing and prevent external network dependencies, the constructor automatically falls back to `MockStorageProvider` when running in the Jest test environment (`process.env.NODE_ENV === 'test'`).

## 3. Large Files Multipart Upload Preparation

The interface defines stubs to chunk-upload files exceeding 100MB:
- `initiateMultipartUpload`
- `uploadPart`
- `completeMultipartUpload`
- `abortMultipartUpload`
These methods map directly to the S3 Multipart SDK calls, allowing the front-end to stream chunk buffers and finalize file aggregation.
