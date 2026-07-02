# Presigned S3 URLs Integration

Presigned URLs allow clients to interact with S3 directly, offloading file transfer workload and bandwidth from the backend API servers.

## 1. Upload flow using Presigned URLs

```
Client App                   FileFlow API                Amazon S3
   │                             │                           │
   │ 1. Request Upload Url       │                           │
   ├────────────────────────────>│                           │
   │                             │ 2. Generate Presigned URL │
   │                             │    (PutObjectCommand)     │
   │                             │                           │
   │ 3. Return URL & Key         │                           │
   |<────────────────────────────┤                           │
   │                             │                           │
   │ 4. PUT file directly to S3  │                           │
   ├─────────────────────────────┼──────────────────────────>│
   │                             │                           │
   │ 5. Register Metadata        │                           │
   ├────────────────────────────>│                           │
```

## 2. API Endpoints

### Generate Presigned Upload URL
* **Request**: `POST /api/v1/storage/presigned-upload`
* **Body**:
```json
{
  "key": "users/user_123/documents/report.pdf",
  "expiresIn": 900
}
```
* **Response**:
```json
{
  "success": true,
  "message": "Presigned upload URL generated successfully",
  "data": {
    "uploadUrl": "https://fileflow-storage-dev.s3.us-east-1.amazonaws.com/...",
    "key": "users/user_123/documents/report.pdf",
    "expiresIn": 900
  }
}
```

### Generate Presigned Download URL
* **Request**: `POST /api/v1/storage/presigned-download`
* **Body**:
```json
{
  "key": "users/user_123/documents/report.pdf",
  "expiresIn": 900
}
```
* **Response**:
```json
{
  "success": true,
  "message": "Presigned download URL generated successfully",
  "data": {
    "downloadUrl": "https://fileflow-storage-dev.s3.us-east-1.amazonaws.com/...",
    "key": "users/user_123/documents/report.pdf",
    "expiresIn": 900
  }
}
```

## 3. Frontend Integration Example (React/Javascript)

Upload file directly to S3:

```javascript
async function uploadToS3(file, storageKey) {
  // 1. Fetch presigned url
  const res = await fetch('/api/v1/storage/presigned-upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`
    },
    body: JSON.stringify({ key: storageKey, expiresIn: 900 })
  });
  
  const { data } = await res.json();
  
  // 2. PUT file stream directly to S3
  const s3Res = await fetch(data.uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type
    },
    body: file
  });
  
  if (s3Res.ok) {
    console.log('File successfully uploaded directly to S3.');
  }
}
```
