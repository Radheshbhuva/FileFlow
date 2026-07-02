# FileFlow Share API Reference

All authenticated endpoints require a valid Bearer JWT token in the `Authorization` header. Public endpoints are unauthenticated.

---

## 1. Owner Management API

All endpoints are mounted under `/api/v1/shares`.

### Initialize Share Link
- **Method & Path**: `POST /`
- **Body Schema (Zod)**:
  ```json
  {
    "fileId": "uuid-file-id-here",
    "accessLevel": "VIEW", // Options: 'VIEW', 'DOWNLOAD', 'EDIT', 'FULL_ACCESS'
    "maxDownloads": 10, // Optional
    "expiryDate": "2026-06-25T12:00:00.000Z", // Optional, must be future
    "password": "secure-link-password" // Optional
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Share link generated successfully",
    "data": {
      "share": {
        "id": "share-uuid-1",
        "fileId": "file-uuid-1",
        "ownerId": "owner-uuid",
        "shareLink": "http://localhost:5173/sh/abc123token",
        "shareToken": "abc123token",
        "accessLevel": "VIEW",
        "shareStatus": "ACTIVE",
        "downloadCount": 0,
        "maxDownloads": 10,
        "expiryDate": "2026-06-25T12:00:00.000Z",
        "passwordProtected": true,
        "createdAt": "2026-06-19T20:20:00.000Z",
        "updatedAt": "2026-06-19T20:20:00.000Z"
      }
    }
  }
  ```

---

### Update Share Parameters
- **Method & Path**: `PATCH /:id`
- **Body Parameters**: `accessLevel`, `maxDownloads` (or null to clear), `expiryDate` (or null to clear), `password` (or null to disable password protection), `shareStatus`
- **Response (200 OK)**: Returns the updated share payload.

---

### Revoke Share
- **Method & Path**: `PATCH /:id/revoke`
- **Response (200 OK)**: Sets status to `REVOKED` and removes public visibility.

---

### Extend Expiry
- **Method & Path**: `PATCH /:id/extend`
- **Body Schema**:
  ```json
  {
    "expiryDate": "2026-07-10T12:00:00.000Z"
  }
  ```
- **Response (200 OK)**: Returns updated share.

---

### Get Shares Analytics
- **Method & Path**: `GET /analytics`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Sharing analytics retrieved successfully",
    "data": {
      "analytics": {
        "totalShares": 20,
        "activeShares": 15,
        "expiredShares": 3,
        "revokedShares": 2,
        "mostDownloadedFiles": [
          { "fileId": "file-1", "fileName": "report.pdf", "downloadCount": 45 }
        ],
        "mostSharedFiles": [
          { "fileId": "file-1", "fileName": "report.pdf", "shareCount": 4 }
        ]
      }
    }
  }
  ```

---

## 2. Public Access API

Mounted under `/api/v1/shares`. No JWT Bearer required.

### Fetch Public Metadata
Lookup a shared file details via public token.
- **Method & Path**: `GET /public/:token`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Public share access unlocked successfully",
    "data": {
      "share": {
        "id": "share-uuid-1",
        "fileId": "file-uuid-1",
        "accessLevel": "VIEW",
        "shareStatus": "ACTIVE",
        "downloadCount": 3,
        "maxDownloads": 10,
        "expiryDate": "2026-06-25T12:00:00.000Z",
        "passwordProtected": true
      },
      "file": {
        "id": "file-uuid-1",
        "fileName": "report.pdf",
        "fileType": "pdf",
        "fileSize": 1048576,
        "mimeType": "application/pdf"
      }
    }
  }
  ```

---

### Verify Share Password
Verify password to retrieve a session authorization token.
- **Method & Path**: `POST /public/:token/verify`
- **Body Parameters**:
  ```json
  {
    "password": "secure-link-password"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Public share password verified successfully",
    "data": {
      "success": true,
      "verificationToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```

---

### Download Shared File
Increments downloads count and returns a direct mock download link.
- **Method & Path**: `POST /public/:token/download`
- **Headers**:
  - `x-share-token`: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` *(Required only if passwordProtected is true)*
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "File downloaded successfully",
    "data": {
      "downloadUrl": "https://fileflow-storage-dev.s3.us-east-1.amazonaws.com/users/owner-1/files/file-uuid-1-report.pdf?AWSAccessKeyId=AKIAIOSFODNN7EXAMPLE...",
      "file": {
        "id": "file-uuid-1",
        "fileName": "report.pdf",
        "fileSize": 1048576
      }
    }
  }
  ```
