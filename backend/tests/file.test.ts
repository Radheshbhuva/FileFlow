import supertest from 'supertest';
import { app } from '../src/app';
import { InMemoryUserRepository } from '../src/modules/auth/repositories/user.repository';
import { InMemoryFileRepository } from '../src/modules/files/repositories/file.repository';
import { TokenService } from '../src/modules/auth/services/token.service';
import { PasswordService } from '../src/modules/auth/services/password.service';

const userRepository = InMemoryUserRepository.getInstance();
const fileRepository = InMemoryFileRepository.getInstance();

describe('FileFlow File Module Integration Tests', () => {
  let tokenA: string;
  let userAId: string;

  let tokenB: string;
  let userBId: string;

  beforeEach(async () => {
    userRepository.clear();
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

  describe('POST /api/v1/files', () => {
    it('should register file metadata and return mock S3 upload URL', async () => {
      const payload = {
        fileName: 'resume.pdf',
        fileType: 'pdf',
        mimeType: 'application/pdf',
        fileSize: 1024 * 1024 * 2,
      };

      const res = await supertest(app)
        .post('/api/v1/files')
        .set('Authorization', `Bearer ${tokenA}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.file.fileName).toBe(payload.fileName);
      expect(res.body.data.file.securityScore).toBe(100);
      expect(res.body.data.uploadUrl).toContain('amazonaws.com');

      const user = await userRepository.findById(userAId);
      expect(user?.storageUsed).toBe(payload.fileSize);
      expect(user?.filesUploadedCount).toBe(1);
    });

    it('should calculate lower security score for high risk executable file types', async () => {
      const payload = {
        fileName: 'installer.exe',
        fileType: 'exe',
        mimeType: 'application/x-msdownload',
        fileSize: 1024 * 1024 * 5,
      };

      const res = await supertest(app)
        .post('/api/v1/files')
        .set('Authorization', `Bearer ${tokenA}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.data.file.securityScore).toBe(60);
    });

    it('should fail creation if user storage quota is exceeded', async () => {
      const payload = {
        fileName: 'huge-dump.zip',
        fileType: 'zip',
        mimeType: 'application/zip',
        fileSize: 6 * 1024 * 1024 * 1024,
      };

      const res = await supertest(app)
        .post('/api/v1/files')
        .set('Authorization', `Bearer ${tokenA}`)
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('limit exceeded');
    });
  });

  describe('GET /api/v1/files', () => {
    it('should list user files with search, filtering, and pagination', async () => {
      const file1 = await fileRepository.create({
        ownerId: userAId,
        fileName: 'report-2026.docx',
        originalName: 'report-2026.docx',
        fileType: 'docx',
        mimeType: 'application/msword',
        fileSize: 500,
        storagePath: 'mock/path/1',
        securityScore: 100,
        favorite: true,
        status: 'ACTIVE',
        shareStatus: 'PRIVATE',
      });

      await fileRepository.create({
        ownerId: userAId,
        fileName: 'photo.jpg',
        originalName: 'photo.jpg',
        fileType: 'jpg',
        mimeType: 'image/jpeg',
        fileSize: 1500,
        storagePath: 'mock/path/2',
        securityScore: 100,
        favorite: false,
        status: 'ACTIVE',
        shareStatus: 'PRIVATE',
      });

      const res = await supertest(app)
        .get('/api/v1/files?search=report&favorite=true')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.files).toHaveLength(1);
      expect(res.body.data.files[0].id).toBe(file1.id);
      expect(res.body.data.total).toBe(1);
    });
  });

  describe('Authorization Barriers', () => {
    let fileAId: string;

    beforeEach(async () => {
      const file = await fileRepository.create({
        ownerId: userAId,
        fileName: 'user-a-file.txt',
        originalName: 'user-a-file.txt',
        fileType: 'txt',
        mimeType: 'text/plain',
        fileSize: 100,
        storagePath: 'mock/path/A',
        securityScore: 100,
        favorite: false,
        status: 'ACTIVE',
        shareStatus: 'PRIVATE',
      });
      fileAId = file.id;
    });

    it('should allow User A to read their own file details', async () => {
      const res = await supertest(app)
        .get(`/api/v1/files/${fileAId}/details`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should block User B from reading User A files details with 403 Forbidden', async () => {
      const res = await supertest(app)
        .get(`/api/v1/files/${fileAId}/details`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('permission');
    });

    it('should block User B from deleting User A files', async () => {
      const res = await supertest(app)
        .delete(`/api/v1/files/${fileAId}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Toggles, Actions, and Storage Syncs', () => {
    let fileId: string;
    const fileSize = 2048;

    beforeEach(async () => {
      const file = await fileRepository.create({
        ownerId: userAId,
        fileName: 'notes.txt',
        originalName: 'notes.txt',
        fileType: 'txt',
        mimeType: 'text/plain',
        fileSize,
        storagePath: 'mock/path/notes',
        securityScore: 100,
        favorite: false,
        status: 'ACTIVE',
        shareStatus: 'PRIVATE',
      });
      fileId = file.id;

      await userRepository.update(userAId, {
        storageUsed: fileSize,
        filesUploadedCount: 1,
      });
    });

    it('should toggle favorite status and update favorites counter on user model', async () => {
      const favRes = await supertest(app)
        .patch(`/api/v1/files/${fileId}/favorite`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ favorite: true });

      expect(favRes.status).toBe(200);
      expect(favRes.body.data.file.favorite).toBe(true);

      let user = await userRepository.findById(userAId);
      expect(user?.favoritesCount).toBe(1);

      const unfavRes = await supertest(app)
        .patch(`/api/v1/files/${fileId}/favorite`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ favorite: false });

      expect(unfavRes.status).toBe(200);
      expect(unfavRes.body.data.file.favorite).toBe(false);

      user = await userRepository.findById(userAId);
      expect(user?.favoritesCount).toBe(0);
    });

    it('should archive and restore files status states', async () => {
      const archiveRes = await supertest(app)
        .patch(`/api/v1/files/${fileId}/archive`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ archive: true });

      expect(archiveRes.status).toBe(200);
      expect(archiveRes.body.data.file.status).toBe('ARCHIVED');
    });

    it('should recalculate security score if sharing status changes', async () => {
      const res = await supertest(app)
        .patch(`/api/v1/files/${fileId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ shareStatus: 'SHARED' });

      expect(res.status).toBe(200);
      expect(res.body.data.file.shareStatus).toBe('SHARED');
      expect(res.body.data.file.securityScore).toBe(85);
    });

    it('should soft delete files and reclaim space', async () => {
      const res = await supertest(app)
        .delete(`/api/v1/files/${fileId}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);

      const user = await userRepository.findById(userAId);
      expect(user?.storageUsed).toBe(0);
      expect(user?.filesUploadedCount).toBe(0);

      const dbFile = await fileRepository.findById(fileId);
      expect(dbFile?.status).toBe('DELETED');
    });
  });
});
