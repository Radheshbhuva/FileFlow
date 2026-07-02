import supertest from 'supertest';
import { app } from '../src/app';
import { InMemoryUserRepository } from '../src/modules/auth/repositories/user.repository';
import { InMemoryFileRepository } from '../src/modules/files/repositories/file.repository';
import { InMemoryShareRepository } from '../src/modules/shares/repositories/share.repository';
import { InMemoryActivityRepository } from '../src/modules/activity/repositories/activity.repository';
import { TokenService } from '../src/modules/auth/services/token.service';
import { PasswordService } from '../src/modules/auth/services/password.service';

const userRepository = InMemoryUserRepository.getInstance();
const fileRepository = InMemoryFileRepository.getInstance();
const shareRepository = InMemoryShareRepository.getInstance();
const activityRepository = InMemoryActivityRepository.getInstance();

describe('FileFlow Dashboard Intelligence Module Integration Tests', () => {
  let tokenA: string;
  let userAId: string;

  let tokenB: string;
  let userBId: string;

  beforeEach(async () => {
    userRepository.clear();
    fileRepository.clear();
    shareRepository.clear();
    activityRepository.clear();

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

    // Populate mock workspace data for User A
    // 1. Storage metrics set
    await userRepository.update(userAId, {
      storageUsed: 1024 * 1024 * 50, // 50 MB
      storageLimit: 1024 * 1024 * 100, // 100 MB Limit (for testing >50% warnings)
      filesUploadedCount: 2,
    });

    // 2. Mock files created
    const file1 = await fileRepository.create({
      ownerId: userAId,
      fileName: 'document.pdf',
      originalName: 'document.pdf',
      fileType: 'pdf',
      mimeType: 'application/pdf',
      fileSize: 1024 * 1024 * 10, // 10MB
      storagePath: 'u/1/document.pdf',
      securityScore: 85, // Shared base score (e.g. sharing penalty already calculated)
      favorite: true,
      status: 'ACTIVE',
      shareStatus: 'SHARED',
    });

    const file2 = await fileRepository.create({
      ownerId: userAId,
      fileName: 'malware.exe',
      originalName: 'malware.exe',
      fileType: 'exe',
      mimeType: 'application/x-msdownload',
      fileSize: 1024 * 1024 * 40, // 40MB
      storagePath: 'u/1/malware.exe',
      securityScore: 40, // High risk file
      favorite: false,
      status: 'ACTIVE',
      shareStatus: 'PRIVATE',
    });

    // 3. Mock active share created
    const share = await shareRepository.create({
      fileId: file1.id,
      ownerId: userAId,
      shareToken: 'token-abc',
      shareLink: 'http://localhost/sh/token-abc',
      accessLevel: 'DOWNLOAD',
      shareStatus: 'ACTIVE',
      passwordProtected: false, // unprotected
    });
    await shareRepository.update(share.id, { downloadCount: 12 });

    // 4. Mock activity events created
    await activityRepository.create({
      userId: userAId,
      activityType: 'LOGIN',
      description: 'Logged in',
      severity: 'INFO',
    });

    await activityRepository.create({
      userId: userAId,
      activityType: 'SHARE_DOWNLOADED',
      description: 'Recipient downloaded file',
      severity: 'INFO',
    });
  });

  describe('GET /api/v1/dashboard/overview', () => {
    it('should retrieve counts matching total files, storage used, and pending attention warnings', async () => {
      const res = await supertest(app)
        .get('/api/v1/dashboard/overview')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.overview.totalFiles).toBe(2);
      expect(res.body.data.overview.totalShares).toBe(1);
      expect(res.body.data.overview.favoritesCount).toBe(1);
      expect(res.body.data.overview.needsAttentionCount).toBe(1); // malware.exe has securityScore < 70
    });
  });

  describe('GET /api/v1/dashboard/storage', () => {
    it('should compute storage percentages, top extensions size list, and largest files sorting', async () => {
      const res = await supertest(app)
        .get('/api/v1/dashboard/storage')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.storage.usagePercentage).toBe(50.0); // 50MB used out of 100MB limit
      expect(res.body.data.storage.largestFiles[0].fileName).toBe('malware.exe'); // 40MB vs 10MB
      expect(res.body.data.storage.topFileTypes[0].extension).toBe('exe'); // Largest extension bytes sum
    });
  });

  describe('GET /api/v1/dashboard/security', () => {
    it('should resolve average security rating, risk levels, and specific recommended updates list', async () => {
      const res = await supertest(app)
        .get('/api/v1/dashboard/security')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.security.riskLevel).toBe('MEDIUM'); // Average = (85 + 40) / 2 = 62.5
      expect(res.body.data.security.securityRecommendations).toHaveLength(3);
      expect(res.body.data.security.securityRecommendations[0]).toContain('unprotected');
    });
  });

  describe('GET /api/v1/dashboard/productivity', () => {
    it('should resolve productivity metrics including download charts and top files accessed lists', async () => {
      const res = await supertest(app)
        .get('/api/v1/dashboard/productivity')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.productivity.mostAccessedFiles[0].downloadCount).toBe(12);
      expect(res.body.data.productivity.favoriteFiles[0].fileName).toBe('document.pdf');
    });
  });

  describe('GET /api/v1/dashboard/insights', () => {
    it('should resolve health score metrics and dashboard strategic insights', async () => {
      const res = await supertest(app)
        .get('/api/v1/dashboard/insights')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.healthScore).toBeGreaterThanOrEqual(0);
      expect(res.body.data.healthScore).toBeLessThanOrEqual(100);
      expect(res.body.data.insights.largestFile.fileName).toBe('malware.exe');
    });
  });

  describe('GET /api/v1/dashboard/notifications', () => {
    it('should generate warning notifications if storage capacity exceeds 50%', async () => {
      // Temporarily update user storage used to trigger the warning notification
      await userRepository.update(userAId, {
        storageUsed: 1024 * 1024 * 80, // 80 MB (80%)
      });

      const res = await supertest(app)
        .get('/api/v1/dashboard/notifications')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.notifications).toBeDefined();
      
      const storageNotification = res.body.data.notifications.find((n: any) => n.type === 'WARNING');
      expect(storageNotification).toBeDefined();
      expect(storageNotification.title).toContain('Storage');

      // Reset storage to original state
      await userRepository.update(userAId, {
        storageUsed: 1024 * 1024 * 50, // 50 MB
      });
    });
  });
});
