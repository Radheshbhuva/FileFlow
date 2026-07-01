import supertest from 'supertest';
import { app } from '../src/app';
import { S3StorageProvider } from '../src/modules/storage/providers/s3.provider';
import { MockStorageProvider } from '../src/modules/storage/providers/mock.provider';
import { InMemoryUserRepository } from '../src/modules/auth/repositories/user.repository';
import { TokenService } from '../src/modules/auth/services/token.service';
import { PasswordService } from '../src/modules/auth/services/password.service';
import { S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const userRepository = InMemoryUserRepository.getInstance();

// Mock S3 Signer function
jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn().mockResolvedValue('https://mock-s3-presigned-url.com/file'),
}));

describe('FileFlow AWS S3 Integration Layer Tests', () => {
  let tokenA: string;
  let userAId: string;

  beforeEach(async () => {
    userRepository.clear();
    const hash = await PasswordService.hash('Password123!');
    const userA = await userRepository.create({
      fullName: 'User A',
      email: 'a@fileflow.com',
      passwordHash: hash,
      role: 'USER',
      planType: 'FREE',
      emailVerified: true,
      accountStatus: 'ACTIVE',
    });
    userAId = userA.id;
    tokenA = TokenService.generateAccessToken({
      sub: userAId,
      email: userA.email,
      role: userA.role,
      planType: userA.planType,
    });
  });

  describe('Storage Providers Unit Tests', () => {
    it('MockStorageProvider should support standard storage CRUD operations', async () => {
      const provider = new MockStorageProvider();
      const key = 'test/path/doc.txt';
      const body = Buffer.from('hello fileflow');

      // 1. Upload
      const result = await provider.upload(key, body, 'text/plain', { owner: 'userA' });
      expect(result.key).toBe(key);
      expect(result.size).toBe(body.length);

      // 2. Exists
      expect(await provider.exists(key)).toBe(true);

      // 3. Metadata
      const meta = await provider.getMetadata(key);
      expect(meta.size).toBe(body.length);
      expect(meta.contentType).toBe('text/plain');
      expect(meta.customMetadata?.owner).toBe('userA');

      // 4. Download
      const downloadResult = await provider.download(key);
      expect(downloadResult.fileBuffer.toString()).toBe('hello fileflow');

      // 5. Copy & Move
      const copiedKey = 'test/path/copied.txt';
      await provider.copy(key, copiedKey);
      expect(await provider.exists(copiedKey)).toBe(true);

      const movedKey = 'test/path/moved.txt';
      await provider.move(copiedKey, movedKey);
      expect(await provider.exists(copiedKey)).toBe(false);
      expect(await provider.exists(movedKey)).toBe(true);

      // 5.5 Rename
      const renamedKey = 'test/path/renamed.txt';
      await provider.rename(movedKey, renamedKey);
      expect(await provider.exists(movedKey)).toBe(false);
      expect(await provider.exists(renamedKey)).toBe(true);

      // 5.6 Presigned helper url generation
      const uploadUrl = await provider.generateUploadUrl(renamedKey, 3600);
      expect(uploadUrl).toContain('operation=upload');
      const downloadUrl = await provider.generateDownloadUrl(renamedKey, 3600);
      expect(downloadUrl).toContain('operation=download');

      // 6. Delete
      await provider.delete(key);
      expect(await provider.exists(key)).toBe(false);
      await provider.delete(renamedKey);
      expect(await provider.exists(renamedKey)).toBe(false);
    });

    it('MockStorageProvider should support Multipart Upload operations', async () => {
      const provider = new MockStorageProvider();
      const key = 'test/large.zip';
      const part1 = Buffer.from('chunk1_');
      const part2 = Buffer.from('chunk2');

      const uploadId = await provider.initiateMultipartUpload(key, 'application/zip');
      expect(uploadId).toBeDefined();

      const p1 = await provider.uploadPart(key, uploadId, 1, part1);
      const p2 = await provider.uploadPart(key, uploadId, 2, part2);

      const result = await provider.completeMultipartUpload(key, uploadId, [p1, p2]);
      expect(result.size).toBe(part1.length + part2.length);

      const downloaded = await provider.download(key);
      expect(downloaded.fileBuffer.toString()).toBe('chunk1_chunk2');
    });

    it('S3StorageProvider should delegate commands correctly to AWS SDK S3Client', async () => {
      (getSignedUrl as jest.Mock).mockResolvedValue('https://mock-s3-presigned-url.com/file');

      const mockSend = jest.fn().mockImplementation((command) => {
        // Mock get object Body stream conversion
        if (command.constructor.name === 'GetObjectCommand') {
          return Promise.resolve({
            ContentType: 'text/html',
            ContentLength: 100,
            Body: {
              transformToByteArray: () => Promise.resolve(new Uint8Array(Buffer.from('mock_s3_body'))),
            },
          });
        }
        if (command.constructor.name === 'HeadObjectCommand') {
          return Promise.resolve({
            ContentType: 'image/png',
            ContentLength: 1000,
            ETag: 'eTagMock',
            LastModified: new Date(),
            Metadata: { key: 'val' },
          });
        }
        return Promise.resolve({ ETag: '"eTagMock"' });
      });

      const fakeClient = { send: mockSend } as unknown as S3Client;
      const s3Provider = new S3StorageProvider(fakeClient, 'my-test-bucket');

      // 1. Upload trigger
      await s3Provider.upload('file.txt', Buffer.from('s3'), 'text/plain');
      expect(mockSend).toHaveBeenCalled();

      // 2. Download trigger
      const dl = await s3Provider.download('file.txt');
      expect(dl.fileBuffer.toString()).toBe('mock_s3_body');

      // 3. Metadata trigger
      const meta = await s3Provider.getMetadata('file.txt');
      expect(meta.eTag).toBe('eTagMock');

      // 4. Presigned Url mapping
      const url = await s3Provider.generatePresignedUrl('doc.txt', 'download', 600);
      expect(url).toBe('https://mock-s3-presigned-url.com/file');

      // 5. Presigned helpers
      const upUrl = await s3Provider.generateUploadUrl('doc.txt', 600);
      expect(upUrl).toBe('https://mock-s3-presigned-url.com/file');
      const downUrl = await s3Provider.generateDownloadUrl('doc.txt', 600);
      expect(downUrl).toBe('https://mock-s3-presigned-url.com/file');

      // 6. Rename/move delegation check
      await s3Provider.rename('source.txt', 'dest.txt');
      expect(mockSend).toHaveBeenCalled();
    });
  });

  describe('REST Endpoints Integration Tests', () => {
    it('POST /api/v1/storage/upload should store buffer in provider', async () => {
      const base64Str = Buffer.from('direct api upload content').toString('base64');
      const response = await supertest(app)
        .post('/api/v1/storage/upload')
        .send({
          key: 'uploads/file.txt',
          fileBase64: base64Str,
          mimeType: 'text/plain',
        })
        .set('Authorization', `Bearer ${tokenA}`);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.key).toBe('uploads/file.txt');
    });

    it('GET /api/v1/storage/metadata should fetch metrics', async () => {
      const base64Str = Buffer.from('metadata check').toString('base64');
      // Upload first
      await supertest(app)
        .post('/api/v1/storage/upload')
        .send({ key: 'check/meta.txt', fileBase64: base64Str, mimeType: 'text/plain' })
        .set('Authorization', `Bearer ${tokenA}`);

      const response = await supertest(app)
        .get('/api/v1/storage/metadata')
        .query({ key: 'check/meta.txt' })
        .set('Authorization', `Bearer ${tokenA}`);

      expect(response.status).toBe(200);
      expect(response.body.data.size).toBe(Buffer.from('metadata check').length);
    });

    it('POST /api/v1/storage/presigned-upload and presigned-download should generate S3 URLs', async () => {
      const responseUpload = await supertest(app)
        .post('/api/v1/storage/presigned-upload')
        .send({ key: 'reports/june.xls', expiresIn: 3600 })
        .set('Authorization', `Bearer ${tokenA}`);

      expect(responseUpload.status).toBe(200);
      expect(responseUpload.body.data.uploadUrl).toBeDefined();

      const responseDownload = await supertest(app)
        .post('/api/v1/storage/presigned-download')
        .send({ key: 'reports/june.xls', expiresIn: 3600 })
        .set('Authorization', `Bearer ${tokenA}`);

      expect(responseDownload.status).toBe(200);
      expect(responseDownload.body.data.downloadUrl).toBeDefined();
    });

    it('POST /api/v1/storage/copy and move should copy/move keys', async () => {
      const base64Str = Buffer.from('origin').toString('base64');
      await supertest(app)
        .post('/api/v1/storage/upload')
        .send({ key: 'origin.txt', fileBase64: base64Str, mimeType: 'text/plain' })
        .set('Authorization', `Bearer ${tokenA}`);

      // Copy
      const copyRes = await supertest(app)
        .post('/api/v1/storage/copy')
        .send({ sourceKey: 'origin.txt', destKey: 'copy.txt' })
        .set('Authorization', `Bearer ${tokenA}`);

      expect(copyRes.status).toBe(200);

      // Move
      const moveRes = await supertest(app)
        .post('/api/v1/storage/move')
        .send({ sourceKey: 'copy.txt', destKey: 'moved.txt' })
        .set('Authorization', `Bearer ${tokenA}`);

      expect(moveRes.status).toBe(200);

      // Rename
      const renameRes = await supertest(app)
        .post('/api/v1/storage/rename')
        .send({ sourceKey: 'moved.txt', destKey: 'renamed.txt' })
        .set('Authorization', `Bearer ${tokenA}`);

      expect(renameRes.status).toBe(200);
      expect(renameRes.body.success).toBe(true);
      expect(renameRes.body.message).toContain('renamed successfully');
    });

    it('DELETE /api/v1/storage/file should remove key', async () => {
      const base64Str = Buffer.from('delete').toString('base64');
      await supertest(app)
        .post('/api/v1/storage/upload')
        .send({ key: 'trash.txt', fileBase64: base64Str, mimeType: 'text/plain' })
        .set('Authorization', `Bearer ${tokenA}`);

      const delRes = await supertest(app)
        .delete('/api/v1/storage/file')
        .query({ key: 'trash.txt' })
        .set('Authorization', `Bearer ${tokenA}`);

      expect(delRes.status).toBe(200);
    });
  });
});
