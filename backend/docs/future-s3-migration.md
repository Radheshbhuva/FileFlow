# FileFlow AWS S3 and Cognito Migration Guide

This document describes how the current local mock implementation of the Upload Module maps to actual AWS Cloud services, including **Amazon S3 Presigned URLs**, **S3 Multipart Uploads**, and **AWS Cognito User Pools**.

---

## 1. Amazon S3 Presigned URL Migration

The current `UploadService` returns mock URLs pointing to AWS. When transitioning to a production S3 bucket, replace the mock generator in `UploadService.createUpload` with the official `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner` client helper:

```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({ region: process.env.AWS_REGION });

async function getPresignedUploadUrl(bucket: string, key: string, contentType: string) {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });
  
  // URL expires in 15 minutes
  return getSignedUrl(s3Client, command, { expiresIn: 900 });
}
```

---

## 2. Multipart Uploads for Large Files (>100MB)

For large files, FileFlow initiates S3 Multipart Uploads. The transition maps directly to our existing API interfaces.

### Initialization (Backend API: `POST /uploads`)
Initiate the multipart upload in S3 and fetch an upload ID, then generate presigned URLs for each part sequence:

```typescript
import { CreateMultipartUploadCommand, UploadPartCommand } from '@aws-sdk/client-s3';

// 1. Create multipart upload transaction in S3
const multipart = await s3Client.send(new CreateMultipartUploadCommand({
  Bucket: bucket,
  Key: key,
  ContentType: contentType
}));

const uploadId = multipart.UploadId; // Save in our Upload database record
const partSize = 5 * 1024 * 1024; // 5MB parts
const totalParts = Math.ceil(fileSize / partSize);
const parts = [];

// 2. Pre-sign each individual part URL
for (let i = 1; i <= totalParts; i++) {
  const command = new UploadPartCommand({
    Bucket: bucket,
    Key: key,
    UploadId: uploadId,
    PartNumber: i
  });
  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  parts.push({ partNumber: i, uploadUrl });
}
```

### Complete Upload (Backend API: `PATCH /uploads/:id/progress`)
When the frontend completes uploading all chunks (reaching progress `100%`), it submits the completed part details (ETags and part numbers) to the backend. The backend then notifies S3 to construct the finalized file:

```typescript
import { CompleteMultipartUploadCommand } from '@aws-sdk/client-s3';

async function completeS3Multipart(upload: Upload, s3Parts: { ETag: string; PartNumber: number }[]) {
  await s3Client.send(new CompleteMultipartUploadCommand({
    Bucket: bucket,
    Key: upload.fileName,
    UploadId: upload.id, // Or the AWS S3 upload ID saved in record
    MultipartUpload: { Parts: s3Parts }
  }));
}
```

---

## 3. AWS Cognito Authentication Migration

Currently, user sessions are protected using our local JWT passport middleware (`protect`). To shift session verification to AWS Cognito:
1. Setup a Cognito User Pool.
2. In `protect` middleware, replace local `jwt.verify` checking with the `aws-jwt-verify` library, which automatically downloads, parses, and validates the Cognito pool JWKs:

```typescript
import { CognitoJwtVerifier } from "aws-jwt-verify";

const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USER_POOL_ID!,
  tokenUse: "access",
  clientId: process.env.COGNITO_CLIENT_ID!,
});

export const protectCognito = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) throw new UnauthorizedError("No token provided");
    
    const payload = await verifier.verify(token);
    req.user = { id: payload.sub, email: payload.email as string };
    next();
  } catch (error) {
    next(new UnauthorizedError("Invalid Cognito Session"));
  }
};
```
This migration path allows FileFlow to scale to millions of concurrent user sessions using AWS Serverless infrastructure.
