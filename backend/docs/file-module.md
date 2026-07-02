# File Management Module Architecture

This document describes the structural designs, lifecycle status models, and S3 migration boundaries for FileFlow's core file management system.

---

## 1. File Status States

Every file metadata record holds a status indicating its availability:

- **`ACTIVE`**: The standard state. The file is fully available for download and sharing.
- **`ARCHIVED`**: Long-term storage state. The file remains queryable but is filtered out of standard list requests unless specifically requested.
- **`DELETED`**: Soft-deleted state. The database record is retained for audit/recovery logs, but it is excluded from all search queries, and its size is subtracted from the user's storage quota limits.

---

## 2. AWS S3 Integration Readiness

To ensure the Express API is ready to migrate to AWS S3 (and eventually AWS Lambda) without API refactoring:

### Presigned URL Flow
The file module avoids processing binary file streams (e.g., using Multer inside container memory). Instead, it delegates transfer loads to direct client-to-S3 uploads:

```text
+--------+                                            +-------------+
|        |----(1) POST /files (File Metadata)-------->|             |
|        |<---(2) Return File record & uploadUrl------|             |
|        |                                            |             |
| Client |                                            | FileFlow API|
|        |----(3) PUT Binary payload (Direct S3)----->|             |
|        |                                            +-------------+
|        |                                                   |
|        |                                            (Writes metadata
|        |                                            to Repository)
+--------+                                                   |
    |                                                        ▼
    +----------------(4) AWS S3 Storage Bucket<--------------+
```

### Storage Paths
Storage paths translate directly to S3 Bucket Keys:
`users/{ownerId}/files/{fileId}-{fileName}`.

- **Local Simulation**: In development, we return a mock S3 upload URL. In production, the service uses `getSignedUrl` from `@aws-sdk/s3-request-presigner` to generate active secure S3 upload paths.
- **Versioning & Lifecycles**: File versioning and retention rules (e.g. purging deleted files after 30 days) are configured directly via **S3 Bucket Lifecycle Rules**, saving computing costs on Lambda.
