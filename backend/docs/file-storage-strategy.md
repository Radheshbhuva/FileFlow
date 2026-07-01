# File Storage Strategy & Key Structure Guide

This document defines the storage organization, tenant isolation rules, folder schema, lifecycle strategies, and cost-optimization configurations for the FileFlow S3 storage layer.

---

## 1. Tenant Isolation & S3 Key Schema

FileFlow is a SaaS application supporting multiple workspaces and tenants. To ensure strict isolation and logical boundaries, all objects stored in S3 follow a structured, deterministic path layout.

### Prefix Namespace Schema
```text
workspaces/{workspaceId}/[entity-type]/{entityId}/{fileName}
```

### Prefix Mappings

| Directory Pattern | Description | Access Rules |
| :--- | :--- | :--- |
| `workspaces/{workspaceId}/files/{fileId}/{fileName}` | Primary user uploads, documents, zip archives, and core workspace assets. | Restricted to authorized workspace members. |
| `workspaces/{workspaceId}/avatars/{userId}/` | Profile images and workspace profile assets. | Publicly viewable or restricted depending on share policies. |
| `workspaces/{workspaceId}/temp/` | Temporary file parts or chunks used during multipart assembly before merger. | Cleaned up automatically. |

### Security Enforcement
Before any operation invokes S3, the backend business modules must:
1. Validate the user's active session and token.
2. Confirm the user's membership and permission scope (e.g. Viewer, Contributor, Owner) within `workspaceId`.
3. Construct the absolute key prefix dynamically using the verified database identifiers (`workspaceId` and `fileId`).
4. Prevent any key traversal or directory manipulation from client inputs.

---

## 2. Object Metadata Tagging

FileFlow tags objects in S3 to allow rich auditing, cost tracking, and programmatic index lookups.

### Custom Metadata Tags
S3 supports key-value metadata tags on `PutObject` commands. The following tags are written during upload:

- `owner-id`: The unique database identifier of the uploading User.
- `workspace-id`: The Workspace associated with the file.
- `original-name`: The original name of the file before normalization or hash renaming.
- `content-type`: The verified MIME-type of the file.

These tags are retrievable efficiently via the `getMetadata` helper on the `StorageProvider`.

---

## 3. Cost Optimization & Intelligent-Tiering

S3 storage costs scale with volume and usage patterns. FileFlow implements S3 cost-optimization strategies:

### S3 Intelligent-Tiering (Default Storage Class)
All files uploaded to S3 use the **Intelligent-Tiering** storage class. S3 Intelligent-Tiering monitors access patterns and automatically shifts items between frequent, infrequent, and archive tiers without performance impact or retrieval charges:

- **Frequent Access Tier**: For files accessed within the last 30 days.
- **Infrequent Access Tier**: For files not accessed for 30 consecutive days (saves up to 40% on storage).
- **Archive Instant Access**: For files not accessed for 90 consecutive days (saves up to 68%).

### Multipart Upload Cleanup Policy
If a client initiates a multipart upload but aborts or disconnects, partial chunk files remain in the bucket, incurring storage fees.
To prevent this, FileFlow configures an S3 Lifecycle Rule to discard incomplete multipart uploads:

```json
{
  "Rules": [
    {
      "ID": "AbortIncompleteMultipartUploads",
      "Status": "Enabled",
      "Filter": {},
      "AbortIncompleteMultipartUpload": {
        "DaysAfterInitiation": 7
      }
    }
  ]
}
```

### Temporary Files Deletion Rule
Files placed under the `workspaces/*/temp/` prefix are automatically purged after 3 days using a bucket lifecycle rule:

```json
{
  "Rules": [
    {
      "ID": "PurgeTempFiles",
      "Status": "Enabled",
      "Filter": {
        "Prefix": "workspaces/*/temp/"
      },
      "Expiration": {
        "Days": 3
      }
    }
  ]
}
```
