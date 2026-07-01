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

describe('FileFlow Smart Collections Module Integration Tests', () => {
  let tokenA: string;
  let userAId: string;

  let tokenB: string;
  let userBId: string;

  let fileNormalId: string;
  let fileOldId: string;
  let fileExeId: string;
  let fileLargeId: string;

  beforeEach(async () => {
    userRepository.clear();
    fileRepository.clear();
    shareRepository.clear();
    activityRepository.clear();

    const passwordHash = await PasswordService.hash('Password123!');

    // Create User A
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

    // Update User A storage settings
    await userRepository.update(userAId, {
      storageUsed: 1024 * 1024 * 200, // 200 MB
      storageLimit: 1024 * 1024 * 500, // 500 MB Limit
    });

    // Create User B (for isolation)
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

    // Populate Files for User A
    // 1. Normal favorited PDF
    const fileNormal = await fileRepository.create({
      ownerId: userAId,
      fileName: 'document.pdf',
      originalName: 'document.pdf',
      fileType: 'pdf',
      mimeType: 'application/pdf',
      fileSize: 1024 * 1024 * 15, // 15MB
      storagePath: 'u/1/document.pdf',
      securityScore: 85,
      favorite: true,
      status: 'ACTIVE',
      shareStatus: 'SHARED',
    });
    fileNormalId = fileNormal.id;

    // 2. Old inactive file (45 days old)
    const fileOld = await fileRepository.create({
      ownerId: userAId,
      fileName: 'archive.txt',
      originalName: 'archive.txt',
      fileType: 'txt',
      mimeType: 'text/plain',
      fileSize: 1024 * 1024 * 2, // 2MB
      storagePath: 'u/1/archive.txt',
      securityScore: 90,
      favorite: false,
      status: 'ACTIVE',
      shareStatus: 'PRIVATE',
    });
    fileOldId = fileOld.id;
    // Backdate fileOld
    const oldDate = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000);
    await fileRepository.update(fileOldId, {
      createdAt: oldDate,
      updatedAt: oldDate,
    });

    // 3. Vulnerable Executable file
    const fileExe = await fileRepository.create({
      ownerId: userAId,
      fileName: 'setup.exe',
      originalName: 'setup.exe',
      fileType: 'exe',
      mimeType: 'application/x-msdownload',
      fileSize: 1024 * 1024 * 8, // 8MB
      storagePath: 'u/1/setup.exe',
      securityScore: 45, // < 50 triggers Executable risk & High risk security Attention
      favorite: false,
      status: 'ACTIVE',
      shareStatus: 'SHARED',
    });
    fileExeId = fileExe.id;

    // 4. Large file (150 MB)
    const fileLarge = await fileRepository.create({
      ownerId: userAId,
      fileName: 'video.mp4',
      originalName: 'video.mp4',
      fileType: 'mp4',
      mimeType: 'video/mp4',
      fileSize: 150 * 1024 * 1024, // 150MB
      storagePath: 'u/1/video.mp4',
      securityScore: 95,
      favorite: false,
      status: 'ACTIVE',
      shareStatus: 'PRIVATE',
    });
    fileLargeId = fileLarge.id;

    // Populate Shares for User A
    // Share for fileNormal
    const shareNormal = await shareRepository.create({
      fileId: fileNormalId,
      ownerId: userAId,
      shareToken: 'token-pdf',
      shareLink: 'http://localhost/sh/token-pdf',
      accessLevel: 'DOWNLOAD',
      shareStatus: 'ACTIVE',
      passwordProtected: false, // unprotected public share
    });
    await shareRepository.update(shareNormal.id, { downloadCount: 25 });

    // Share for fileExe
    const shareExe = await shareRepository.create({
      fileId: fileExeId,
      ownerId: userAId,
      shareToken: 'token-exe',
      shareLink: 'http://localhost/sh/token-exe',
      accessLevel: 'DOWNLOAD',
      shareStatus: 'ACTIVE',
      passwordProtected: false, // unprotected high-risk file
    });
    await shareRepository.update(shareExe.id, { downloadCount: 5 });

    // Create favorite activity event
    await activityRepository.create({
      userId: userAId,
      activityType: 'FILE_FAVORITED',
      resourceType: 'FILE',
      resourceId: fileNormalId,
      resourceName: 'document.pdf',
      description: 'Favorited document.pdf',
      severity: 'INFO',
    });
  });

  describe('GET /api/v1/collections', () => {
    it('should retrieve list of 5 smart collections with endpoints and current counts', async () => {
      const res = await supertest(app)
        .get('/api/v1/collections')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.collections).toHaveLength(5);
      
      const favoritesColl = res.body.data.collections.find((c: any) => c.id === 'favorites');
      expect(favoritesColl).toBeDefined();
      expect(favoritesColl.count).toBe(1); // Only document.pdf is favorited
    });
  });

  describe('GET /api/v1/collections/recently-modified', () => {
    it('should filter files updated in last 7 days by default', async () => {
      const res = await supertest(app)
        .get('/api/v1/collections/recently-modified')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.files).toHaveLength(3); // normal, exe, large (not the old 45d file)
      expect(res.body.data.days).toBe(7);
    });

    it('should expand query bounds if custom days parameter is provided', async () => {
      const res = await supertest(app)
        .get('/api/v1/collections/recently-modified?days=50')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.files).toHaveLength(4); // includes the old file now
      expect(res.body.data.days).toBe(50);
    });

    it('should reject invalid non-integer days parameter with 400 Bad Request', async () => {
      const res = await supertest(app)
        .get('/api/v1/collections/recently-modified?days=-5')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/v1/collections/shared-recently', () => {
    it('should retrieve shared files with aggregate share counts and download counts', async () => {
      const res = await supertest(app)
        .get('/api/v1/collections/shared-recently')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.files).toHaveLength(2); // fileNormal and fileExe have active shares
      
      const pdfItem = res.body.data.files.find((f: any) => f.id === fileNormalId);
      expect(pdfItem).toBeDefined();
      expect(pdfItem.shareCount).toBe(1);
      expect(pdfItem.downloadCount).toBe(25);
    });
  });

  describe('GET /api/v1/collections/favorites', () => {
    it('should retrieve favorited files list and extract related activity events', async () => {
      const res = await supertest(app)
        .get('/api/v1/collections/favorites')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.files).toHaveLength(1);
      expect(res.body.data.favoriteCount).toBe(1);
      expect(res.body.data.recentFavoriteActivity).toHaveLength(1);
      expect(res.body.data.recentFavoriteActivity[0].activityType).toBe('FILE_FAVORITED');
    });
  });

  describe('GET /api/v1/collections/large-files', () => {
    it('should retrieve files exceeding default 100MB threshold', async () => {
      const res = await supertest(app)
        .get('/api/v1/collections/large-files')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.files).toHaveLength(1); // Only video.mp4 (150MB)
      expect(res.body.data.files[0].id).toBe(fileLargeId);
      expect(res.body.data.files[0].storageImpact).toBe(30.0); // 150MB out of 500MB limit = 30%
      expect(res.body.data.thresholdMb).toBe(100);
    });

    it('should filter by custom threshold limit in MB', async () => {
      const res = await supertest(app)
        .get('/api/v1/collections/large-files?thresholdMb=10')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.files).toHaveLength(2); // Includes video.mp4 (150MB) and document.pdf (15MB)
      expect(res.body.data.thresholdMb).toBe(10);
    });
  });

  describe('GET /api/v1/collections/needs-attention', () => {
    it('should identify vulnerable and inactive files flagged with reasons sorted by risk level', async () => {
      const res = await supertest(app)
        .get('/api/v1/collections/needs-attention')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      
      const attentionFiles = res.body.data.files;
      // Should find fileExe, fileNormal, and fileOld
      expect(attentionFiles).toHaveLength(3);

      // Verify exe triggers
      const exeItem = attentionFiles.find((a: any) => a.file.id === fileExeId);
      expect(exeItem).toBeDefined();
      expect(exeItem.riskLevel).toBe('HIGH');
      expect(exeItem.reasons).toContain('LOW_SECURITY_SCORE');
      expect(exeItem.reasons).toContain('EXECUTABLE_RISK');

      // Verify normal file triggers
      const pdfItem = attentionFiles.find((a: any) => a.file.id === fileNormalId);
      expect(pdfItem).toBeDefined();
      expect(pdfItem.riskLevel).toBe('HIGH');
      expect(pdfItem.reasons).toContain('UNPROTECTED_SHARE');

      // Verify inactive trigger
      const oldItem = attentionFiles.find((a: any) => a.file.id === fileOldId);
      expect(oldItem).toBeDefined();
      expect(oldItem.riskLevel).toBe('LOW');
      expect(oldItem.reasons).toContain('INACTIVE_FILE');
    });
  });

  describe('GET /api/v1/collections/summary', () => {
    it('should aggregate file counts, ratios, and security metrics', async () => {
      const res = await supertest(app)
        .get('/api/v1/collections/summary')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      
      const summary = res.body.data.summary;
      expect(summary.collectionCounts.recentlyModified).toBe(3);
      expect(summary.collectionCounts.largeFiles).toBe(1);
      expect(summary.collectionMetrics.totalFiles).toBe(4);
      expect(summary.healthIndicators.unsecuredShareCount).toBe(2); // Both shares are unprotected
    });
  });

  describe('Smart Collections Isolation & Authentication checks', () => {
    it('should isolate collection feeds between different workspace users', async () => {
      // User B query
      const res = await supertest(app)
        .get('/api/v1/collections/favorites')
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(200);
      expect(res.body.data.files).toHaveLength(0); // User B has no favorited files
      expect(res.body.data.favoriteCount).toBe(0);
    });

    it('should block unauthenticated requests with a 401 Unauthorized error', async () => {
      const res = await supertest(app).get('/api/v1/collections');
      expect(res.status).toBe(401);
    });
  });

  describe('Future AI Preparation endpoint mocks', () => {
    it('should return mock AI recommendations structure successfully', async () => {
      const res = await supertest(app)
        .get('/api/v1/collections/ai-recommendations')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.recommendations).toBeDefined();
      expect(res.body.data.recommendations[0].confidenceScore).toBeDefined();
      expect(res.body.data.recommendations[0].recommendationReason).toBeDefined();
    });

    it('should return mock Frequently Accessed details successfully', async () => {
      const res = await supertest(app)
        .get('/api/v1/collections/frequently-accessed')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.files).toBeDefined();
    });
  });
});
