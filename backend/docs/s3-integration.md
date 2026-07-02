# AWS S3 Storage Integration

FileFlow integrates with Amazon S3 using the official AWS SDK v3 client commands.

## 1. Environment Configurations

Configure the following variables in your `.env` settings:

```bash
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET_NAME=fileflow-production-bucket
```

## 2. AWS IAM Least Privilege Policy

To integrate with S3 securely, create an IAM user with standard policies restricting actions specifically to your target bucket:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:PutObjectAcl",
        "s3:HeadObject",
        "s3:AbortMultipartUpload",
        "s3:ListMultipartUploadParts"
      ],
      "Resource": "arn:aws:s3:::fileflow-production-bucket/*"
    }
  ]
}
```

## 3. S3 Bucket CORS Configuration

If generating presigned upload URLs for front-end uploads directly to S3, configure the S3 Bucket CORS rules:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedOrigins": ["http://localhost:5173", "https://app.fileflow.com"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

## 4. Large Files Multipart SDK Support

For files exceeding 100MB, the provider exposes:
- **`CreateMultipartUploadCommand`**: Initiates upload session and receives `UploadId`.
- **`UploadPartCommand`**: Streams binary part chunks.
- **`CompleteMultipartUploadCommand`**: Finalizes the parts aggregation on S3.

## 5. Storage Provider Extensions

To support clean renaming and simplified presigned url helpers, the following methods are added:
- **`rename(sourceKey, destKey)`**: Renames objects atomically inside S3 (leveraging S3 `CopyObjectCommand` and `DeleteObjectCommand`).
- **`generateUploadUrl(key, expiresInSeconds)`**: Returns short-lived `PutObjectCommand` URLs.
- **`generateDownloadUrl(key, expiresInSeconds)`**: Returns short-lived `GetObjectCommand` URLs.

These operations are exposed via standard endpoints:
- `POST /api/v1/storage/rename`: Renames objects using Zod schema verification.
- `POST /api/v1/storage/presigned-upload`: Generates upload URL.
- `POST /api/v1/storage/presigned-download`: Generates download URL.
