# S3 Presigned URLs Integration Guide

Presigned URLs allow clients to interact with Amazon S3 directly, offloading file transfer workload, network bandwidth, and memory allocation from the backend API servers to AWS infrastructure.

---

## 1. Presigned URLs Workflow

```
Client App                   FileFlow API                Amazon S3
   │                             │                           │
   │ 1. Request URL (GET/PUT)    │                           │
   ├────────────────────────────>│                           │
   │                             │ 2. Generate Presigned URL │
   │                             │    (PutObject/GetObject)   │
   │                             │                           │
   │ 3. Return URL & S3 Key      │                           │
   │<────────────────────────────┤                           │
   │                             │                           │
   │ 4. HTTP Transfer (PUT/GET)  │                           │
   ├─────────────────────────────┼──────────────────────────>│
   │                             │                           │
```

1. **Request**: The client requests a presigned URL for upload or download, specifying the destination S3 key and the expiry time.
2. **Generation**: The backend uses the `StorageProvider` helpers to generate an S3 presigned URL without checking if the object exists (for upload) or using signing keys derived from AWS Credentials.
3. **Execution**: The client executes a direct `PUT` (for upload) or `GET` (for download) request to the S3 bucket URL within the specified expiration window.

---

## 2. Storage Provider Interface Mappings

The `StorageProvider` interface declares dedicated helper methods to generate presigned URLs:

```typescript
export interface StorageProvider {
  /**
   * Generates a short-lived presigned URL for upload or download operations.
   */
  generatePresignedUrl(
    key: string,
    operation: 'upload' | 'download',
    expiresInSeconds: number
  ): Promise<string>;

  /**
   * Generates a short-lived presigned URL specifically for upload operations.
   */
  generateUploadUrl(key: string, expiresInSeconds: number): Promise<string>;

  /**
   * Generates a short-lived presigned URL specifically for download operations.
   */
  generateDownloadUrl(key: string, expiresInSeconds: number): Promise<string>;
}
```

These maps to:
- **`PutObjectCommand`** inside the S3 SDK for upload operations.
- **`GetObjectCommand`** inside the S3 SDK for download operations.

---

## 3. Provider Implementations

### AWS S3 Implementation (`S3StorageProvider`)
Under the hood, S3StorageProvider utilizes `@aws-sdk/s3-request-presigner` via the `getSignedUrl` function:

```typescript
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

// Generates S3 V4 Signature URLs using the initialized S3 client credentials
const command = new PutObjectCommand({ Bucket: bucket, Key: key });
const url = await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
```

### Local/Mock Implementation (`MockStorageProvider`)
For local environments and offline unit tests, the `MockStorageProvider` produces offline-testable signed urls:

```text
https://fileflow-storage-dev.s3.us-east-1.amazonaws.com/{key}?operation={operation}&expires={expires}&sig={signature}
```

This prevents external network calls during automated testing while allowing validation of logic.

---

## 4. REST API Endpoint Details

### A. Generate Upload URL
* **Route**: `POST /api/v1/storage/presigned-upload`
* **Validation Schema**:
  ```typescript
  export const presignedUploadSchema = {
    body: z.object({
      key: z.string().min(1, 'Key is required').max(1024),
      expiresIn: z.number().int().min(1).max(604800).optional(),
    }),
  };
  ```
* **Sample Payload**:
  ```json
  {
    "key": "workspaces/ws_99/files/document.pdf",
    "expiresIn": 1800
  }
  ```
* **Success Response**:
  ```json
  {
    "success": true,
    "message": "Presigned upload URL generated successfully",
    "data": {
      "uploadUrl": "https://fileflow-storage-dev.s3.us-east-1.amazonaws.com/workspaces/ws_99/files/document.pdf?X-Amz-Algorithm=AWS4-HMAC-SHA256&...",
      "key": "workspaces/ws_99/files/document.pdf",
      "expiresIn": 1800
    }
  }
  ```

### B. Generate Download URL
* **Route**: `POST /api/v1/storage/presigned-download`
* **Validation Schema**:
  ```typescript
  export const presignedDownloadSchema = {
    body: z.object({
      key: z.string().min(1, 'Key is required').max(1024),
      expiresIn: z.number().int().min(1).max(604800).optional(),
    }),
  };
  ```
* **Sample Payload**:
  ```json
  {
    "key": "workspaces/ws_99/files/document.pdf",
    "expiresIn": 3600
  }
  ```
* **Success Response**:
  ```json
  {
    "success": true,
    "message": "Presigned download URL generated successfully",
    "data": {
      "downloadUrl": "https://fileflow-storage-dev.s3.us-east-1.amazonaws.com/workspaces/ws_99/files/document.pdf?X-Amz-Algorithm=AWS4-HMAC-SHA256&...",
      "key": "workspaces/ws_99/files/document.pdf",
      "expiresIn": 3600
    }
  }
  ```

---

## 5. Security & Best Practices

1. **Short Lifetimes**: Keep `expiresIn` values short. The default is **900 seconds (15 minutes)**. For large uploads, adjust up to 1-2 hours depending on connection speed.
2. **HTTPS Only**: Ensure all S3 connections are encrypted. Presigned URLs must always use `https://`.
3. **Key Isolation**: Never allow users to generate URLs for paths outside their tenant prefix (e.g. `workspaces/{workspaceId}/...`). Validate the workspace permission in your business layers before generating the URL.
