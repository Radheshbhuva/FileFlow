# File Management API Reference

All endpoints reside under `/api/v1/files/` and require a valid `Authorization: Bearer <token>` header.

---

## 1. Register File and Get Upload Link (`POST /api/v1/files`)
Creates metadata records and returns an S3 upload URL.

### Request Body
```json
{
  "fileName": "report.pdf",
  "fileType": "pdf",
  "mimeType": "application/pdf",
  "fileSize": 10485760
}
```

### Response (211 Created)
```json
{
  "success": true,
  "message": "File created and upload URL generated",
  "data": {
    "file": {
      "id": "76df4d79-3aaa-40e5-8b95-993154e2d3eb",
      "ownerId": "e444cf7f-c0a9-4753-a05e-ebac9444cf7f",
      "fileName": "report.pdf",
      "originalName": "report.pdf",
      "fileType": "pdf",
      "mimeType": "application/pdf",
      "fileSize": 10485760,
      "storagePath": "users/e444cf7f-c0a9-4753-a05e-ebac9444cf7f/files/76df4d79-3aaa-40e5-8b95-993154e2d3eb-report.pdf",
      "securityScore": 90,
      "favorite": false,
      "status": "ACTIVE",
      "shareStatus": "PRIVATE",
      "createdAt": "2026-06-19T14:27:00Z",
      "updatedAt": "2026-06-19T14:27:00Z"
    },
    "uploadUrl": "https://fileflow-storage-dev.s3.us-east-1.amazonaws.com/users/e444cf7f-c0a9-4753-a05e-ebac9444cf7f/files/76df4d79-3aaa-40e5-8b95-993154e2d3eb-report.pdf?AWSAccessKeyId=AKIAIOSFODNN7EXAMPLE&Signature=mockSignature&Expires=1781254300"
  }
}
```

---

## 2. List Files (`GET /api/v1/files`)
Lists files matching filter query criteria.

### Query Parameters
- **`page`**: Page number (default: `1`).
- **`limit`**: Number of items per page (default: `10`).
- **`sortBy`**: Field to sort by: `fileName`, `fileSize`, `createdAt`, `securityScore` (default: `createdAt`).
- **`sortOrder`**: Sort direction: `asc` or `desc` (default: `desc`).
- **`search`**: Filename search string.
- **`fileType`**: Filter by extension (e.g. `pdf`).
- **`favorite`**: Filter by favorites status (`true` / `false`).
- **`shareStatus`**: Filter by sharing status (`PRIVATE` / `SHARED`).
- **`minSecurityScore`**: Filter files with a score higher than target value.

### Response (200 OK)
```json
{
  "success": true,
  "message": "Files retrieved successfully",
  "data": {
    "files": [...],
    "total": 1,
    "page": 1,
    "limit": 10
  }
}
```

---

## 3. Retrieve Enriched Details (`GET /api/v1/files/:id/details`)
Returns the file's metadata alongside security insights and owner profiles.

### Response (200 OK)
```json
{
  "success": true,
  "message": "File details retrieved successfully",
  "data": {
    "metadata": { ... },
    "securityAnalysis": {
      "score": 90,
      "riskLevel": "LOW",
      "sharingAnalysis": "File is private and access-restricted."
    },
    "owner": {
      "id": "e444cf7f-c0a9-4753-a05e-ebac9444cf7f",
      "fullName": "Jane Doe",
      "email": "jane@fileflow.com"
    },
    "storage": {
      "fileSize": 10485760,
      "storageLimit": 5368709120
    },
    "activitySummary": {
      "lastModified": "2026-06-19T14:27:00Z"
    }
  }
}
```

---

## 4. Toggle Favorite Status (`PATCH /api/v1/files/:id/favorite`)
Toggles the favorite status of a file.

### Request Body (Optional)
```json
{
  "favorite": true
}
```
If the body is empty, the endpoint toggles the status.

---

## 5. Toggle Archive Status (`PATCH /api/v1/files/:id/archive`)
Archives or restores a file.

### Request Body (Optional)
```json
{
  "archive": true
}
```
If the body is empty, the endpoint toggles the status.
