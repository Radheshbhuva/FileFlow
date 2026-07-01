# FileFlow Upload API Reference

All endpoints are prefix-mounted under `/api/v1/uploads` (or equivalent Express routing path) and require a valid Bearer JWT token in the `Authorization` header.

---

## Endpoint Summary

| Method | Path | Description | Access |
|---|---|---|---|
| **POST** | `/` | Initialize upload transaction | Authenticated |
| **GET** | `/` | List active uploads (history) | Authenticated |
| **GET** | `/analytics` | Get user upload analytics aggregates | Authenticated |
| **GET** | `/history` | Retrieve historical upload logs | Authenticated |
| **GET** | `/:id` | Get details of a specific upload | Owner Only |
| **DELETE** | `/:id` | Delete/discard upload record | Owner Only |
| **PATCH** | `/:id/progress` | Update upload progress status | Owner Only |
| **PATCH** | `/:id/retry` | Restart a failed or cancelled upload | Owner Only |
| **PATCH** | `/:id/cancel` | Cancel an active/pending upload | Owner Only |

---

## Endpoint Details

### 1. Initialize Upload
Initialize a new upload transaction.

- **URL**: `POST /`
- **Request Body**:
  ```json
  {
    "fileName": "document.pdf",
    "fileSize": 1048576,
    "mimeType": "application/pdf",
    "uploadMethod": "STANDARD" 
  }
  ```
  *Note: `uploadMethod` can be `STANDARD`, `MULTIPART`, or `CHUNKED`.*
- **Success Response (201 Created)**:
  - **STANDARD Method**:
    ```json
    {
      "success": true,
      "message": "Upload transaction initialized successfully",
      "data": {
        "upload": {
          "id": "e2c341b5-31a8-4bb9-bd86-8a7e44a49c9f",
          "userId": "usr-123",
          "uploadStatus": "PENDING",
          "fileName": "document.pdf",
          "fileSize": 1048576,
          "mimeType": "application/pdf",
          "uploadProgress": 0,
          "uploadMethod": "STANDARD",
          "startedAt": "2026-06-19T20:00:00.000Z",
          "createdAt": "2026-06-19T20:00:00.000Z"
        },
        "uploadUrl": "https://fileflow-storage-dev.s3.us-east-1.amazonaws.com/uploads/e2c341b5-31a8-4bb9-bd86-8a7e44a49c9f/document.pdf"
      }
    }
    ```
  - **MULTIPART Method**:
    For files larger than 100 MB, part counts and part presigned URLs are calculated:
    ```json
    {
      "success": true,
      "message": "Upload transaction initialized successfully",
      "data": {
        "upload": {
          "id": "e2c341b5-31a8-4bb9-bd86-8a7e44a49c9f",
          "userId": "usr-123",
          "uploadStatus": "PENDING",
          "fileName": "large-video.mp4",
          "fileSize": 15728640,
          "mimeType": "video/mp4",
          "uploadProgress": 0,
          "uploadMethod": "MULTIPART",
          "startedAt": "2026-06-19T20:00:00.000Z",
          "createdAt": "2026-06-19T20:00:00.000Z"
        },
        "parts": [
          { "partNumber": 1, "uploadUrl": "https://fileflow-storage-dev.s3.us-east-1.amazonaws.com/uploads/e2c341b5-31a8-4bb9-bd86-8a7e44a49c9f/part-1?AWSAccessKeyId=AKIAIOSFODNN7EXAMPLE&partNumber=1" },
          { "partNumber": 2, "uploadUrl": "https://fileflow-storage-dev.s3.us-east-1.amazonaws.com/uploads/e2c341b5-31a8-4bb9-bd86-8a7e44a49c9f/part-2?AWSAccessKeyId=AKIAIOSFODNN7EXAMPLE&partNumber=2" },
          { "partNumber": 3, "uploadUrl": "https://fileflow-storage-dev.s3.us-east-1.amazonaws.com/uploads/e2c341b5-31a8-4bb9-bd86-8a7e44a49c9f/part-3?AWSAccessKeyId=AKIAIOSFODNN7EXAMPLE&partNumber=3" }
        ]
      }
    }
    ```

---

### 2. Update Upload Progress
Reports current upload progress percentage. Reaching 100% completes the upload and registers the file.

- **URL**: `PATCH /:id/progress`
- **Request Body**:
  ```json
  {
    "uploadProgress": 50
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Upload progress updated successfully",
    "data": {
      "upload": {
        "id": "e2c341b5-31a8-4bb9-bd86-8a7e44a49c9f",
        "userId": "usr-123",
        "uploadStatus": "UPLOADING",
        "fileName": "document.pdf",
        "fileSize": 1048576,
        "mimeType": "application/pdf",
        "uploadProgress": 50,
        "uploadMethod": "STANDARD",
        "startedAt": "2026-06-19T20:00:00.000Z",
        "createdAt": "2026-06-19T20:00:00.000Z"
      }
    }
  }
  ```

---

### 3. Cancel Upload
Explicitly cancels an active upload transaction.

- **URL**: `PATCH /:id/cancel`
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Upload cancelled successfully",
    "data": {
      "upload": {
        "id": "e2c341b5-31a8-4bb9-bd86-8a7e44a49c9f",
        "userId": "usr-123",
        "uploadStatus": "CANCELLED",
        "fileName": "document.pdf",
        "fileSize": 1048576,
        "uploadProgress": 50,
        "failedAt": "2026-06-19T20:05:00.000Z"
      }
    }
  }
  ```

---

### 4. Retry Upload
Restarts a failed/cancelled upload transaction, setting progress to 0% and status to PENDING.

- **URL**: `PATCH /:id/retry`
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Upload retried successfully",
    "data": {
      "upload": {
        "id": "e2c341b5-31a8-4bb9-bd86-8a7e44a49c9f",
        "userId": "usr-123",
        "uploadStatus": "PENDING",
        "uploadProgress": 0
      }
    }
  }
  ```
