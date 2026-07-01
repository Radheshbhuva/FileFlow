import supertest from 'supertest';
import { app } from '../src/app';
import { InMemoryUserRepository } from '../src/modules/auth/repositories/user.repository';
import { InMemoryUploadRepository } from '../src/modules/uploads/repositories/upload.repository';
import { InMemoryFileRepository } from '../src/modules/files/repositories/file.repository';
import { TokenService } from '../src/modules/auth/services/token.service';
import { PasswordService } from '../src/modules/auth/services/password.service';

const userRepository = InMemoryUserRepository.getInstance();
const uploadRepository = InMemoryUploadRepository.getInstance();
const fileRepository = InMemoryFileRepository.getInstance();

describe('FileFlow Upload Module Integration Tests', () => {
  let tokenA: string;
  let userAId: string;

  let tokenB: string;
  let userBId: string;

  beforeEach(async () => {
    userRepository.clear();
    uploadRepository.clear();
    fileRepository.clear();

    const passwordHash = await PasswordService.hash('Password123!');

    const userA = await userRepository.create({
      fullName: 'User A',
      email: 'a@fileflow.com',
      passwordHash,
      role: 'USER',
      planType: 'FREE',
      emailVerified: true,
      accountStatus: 'ACTIVE',
    });
    userAId = userA.id;
    tokenA = TokenService.generateAccessToken({
      sub: userA.id,
      email: userA.email,
      role: userA.role,
      planType: userA.planType,
    });

    const userB = await userRepository.create({
      fullName: 'User B',
      email: 'b@fileflow.com',
      passwordHash,
      role: 'USER',
      planType: 'FREE',
      emailVerified: true,
      accountStatus: 'ACTIVE',
    });
    userBId = userB.id;
    tokenB = TokenService.generateAccessToken({
      sub: userB.id,
      email: userB.email,
      role: userB.role,
      planType: userB.planType,
    });
  });

  describe('POST /api/v1/uploads', () => {
    it('should initialize a standard upload and return S3 upload URL', async () => {
      const payload = {
        fileName: 'document.pdf',
        fileSize: 1024 * 1024 * 5, // 5MB
        mimeType: 'application/pdf',
        uploadMethod: 'STANDARD',
      };

      const res = await supertest(app)
        .post('/api/v1/uploads')
        .set('Authorization', `Bearer ${tokenA}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.upload.fileName).toBe(payload.fileName);
      expect(res.body.data.upload.uploadStatus).toBe('PENDING');
      expect(res.body.data.uploadUrl).toContain('amazonaws.com');
    });

    it('should initialize a multipart upload and return part upload URLs', async () => {
      const payload = {
        fileName: 'large-video.mp4',
        fileSize: 1024 * 1024 * 15, // 15MB -> 3 parts
        mimeType: 'video/mp4',
        uploadMethod: 'MULTIPART',
      };

      const res = await supertest(app)
        .post('/api/v1/uploads')
        .set('Authorization', `Bearer ${tokenA}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.upload.uploadMethod).toBe('MULTIPART');
      expect(res.body.data.parts).toHaveLength(3);
      expect(res.body.data.parts[0].partNumber).toBe(1);
      expect(res.body.data.parts[0].uploadUrl).toContain('part-1');
    });

    it('should block execution extension file types for security', async () => {
      const payload = {
        fileName: 'malware.exe',
        fileSize: 1024,
        mimeType: 'application/octet-stream',
        uploadMethod: 'STANDARD',
      };

      const res = await supertest(app)
        .post('/api/v1/uploads')
        .set('Authorization', `Bearer ${tokenA}`)
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Restricted file extension');
    });

    it('should block upload if user storage limit is exceeded', async () => {
      // Artificially inflate User A storage
      await userRepository.update(userAId, {
        storageUsed: 5 * 1024 * 1024 * 1024 - 100, // 100 bytes left
      });

      const payload = {
        fileName: 'image.png',
        fileSize: 200, // Exceeds limit
        mimeType: 'image/png',
        uploadMethod: 'STANDARD',
      };

      const res = await supertest(app)
        .post('/api/v1/uploads')
        .set('Authorization', `Bearer ${tokenA}`)
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('limit exceeded');
    });
  });

  describe('PATCH /api/v1/uploads/:id/progress', () => {
    let uploadId: string;

    beforeEach(async () => {
      const upload = await uploadRepository.create({
        userId: userAId,
        uploadStatus: 'PENDING',
        fileName: 'test.txt',
        fileSize: 1024,
        mimeType: 'text/plain',
        uploadProgress: 0,
        uploadMethod: 'STANDARD',
        startedAt: new Date(),
      });
      uploadId = upload.id;
    });

    it('should update progress and status to UPLOADING', async () => {
      const res = await supertest(app)
        .patch(`/api/v1/uploads/${uploadId}/progress`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ uploadProgress: 45 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.upload.uploadProgress).toBe(45);
      expect(res.body.data.upload.uploadStatus).toBe('UPLOADING');
    });

    it('should automatically finalize file in FileModule and sync storage counters on reaching 100%', async () => {
      const res = await supertest(app)
        .patch(`/api/v1/uploads/${uploadId}/progress`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ uploadProgress: 100 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.upload.uploadProgress).toBe(100);
      expect(res.body.data.upload.uploadStatus).toBe('COMPLETED');
      expect(res.body.data.upload.fileId).toBeDefined();

      // Check file was actually registered
      const fileId = res.body.data.upload.fileId;
      const file = await fileRepository.findById(fileId);
      expect(file).toBeDefined();
      expect(file?.fileName).toBe('test.txt');

      // Check storage usage sync on user
      const user = await userRepository.findById(userAId);
      expect(user?.storageUsed).toBe(1024);
      expect(user?.filesUploadedCount).toBe(1);
    });

    it('should prevent User B from updating User A upload progress', async () => {
      const res = await supertest(app)
        .patch(`/api/v1/uploads/${uploadId}/progress`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ uploadProgress: 50 });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('permission');
    });
  });

  describe('Upload Recovery Gates (Retry & Cancel)', () => {
    let failedUploadId: string;
    let completedUploadId: string;

    beforeEach(async () => {
      const upload1 = await uploadRepository.create({
        userId: userAId,
        uploadStatus: 'FAILED',
        fileName: 'failed.txt',
        fileSize: 1024,
        mimeType: 'text/plain',
        uploadProgress: 20,
        uploadMethod: 'STANDARD',
        startedAt: new Date(),
        errorMessage: 'Network lost',
      });
      failedUploadId = upload1.id;

      const upload2 = await uploadRepository.create({
        userId: userAId,
        uploadStatus: 'COMPLETED',
        fileName: 'done.txt',
        fileSize: 1024,
        mimeType: 'text/plain',
        uploadProgress: 100,
        uploadMethod: 'STANDARD',
        startedAt: new Date(),
      });
      completedUploadId = upload2.id;
    });

    it('should retry a failed upload resetting progress and status', async () => {
      const res = await supertest(app)
        .patch(`/api/v1/uploads/${failedUploadId}/retry`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.upload.uploadStatus).toBe('PENDING');
      expect(res.body.data.upload.uploadProgress).toBe(0);
      expect(res.body.data.upload.errorMessage).toBeUndefined();
    });

    it('should fail to retry a completed upload', async () => {
      const res = await supertest(app)
        .patch(`/api/v1/uploads/${completedUploadId}/retry`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Only failed or cancelled');
    });

    it('should cancel a failed or active upload', async () => {
      const res = await supertest(app)
        .patch(`/api/v1/uploads/${failedUploadId}/cancel`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.upload.uploadStatus).toBe('CANCELLED');
    });

    it('should fail to cancel a completed upload', async () => {
      const res = await supertest(app)
        .patch(`/api/v1/uploads/${completedUploadId}/cancel`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/uploads/analytics', () => {
    it('should calculate correct upload aggregates', async () => {
      await uploadRepository.create({
        userId: userAId,
        uploadStatus: 'COMPLETED',
        fileName: 'f1.txt',
        fileSize: 1000,
        mimeType: 'text/plain',
        uploadProgress: 100,
        uploadMethod: 'STANDARD',
        startedAt: new Date(),
      });

      await uploadRepository.create({
        userId: userAId,
        uploadStatus: 'FAILED',
        fileName: 'f2.txt',
        fileSize: 4000,
        mimeType: 'text/plain',
        uploadProgress: 50,
        uploadMethod: 'STANDARD',
        startedAt: new Date(),
      });

      const res = await supertest(app)
        .get('/api/v1/uploads/analytics')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.analytics.totalUploads).toBe(2);
      expect(res.body.data.analytics.successRate).toBe(50.0);
      expect(res.body.data.analytics.failureRate).toBe(50.0);
      expect(res.body.data.analytics.averageUploadSize).toBe(2500);
      expect(res.body.data.analytics.largestUpload).toBe(4000);
    });
  });
});
