import supertest from 'supertest';
import { app } from '../src/app';
import { InMemoryUserRepository } from '../src/modules/auth/repositories/user.repository';
import { InMemoryFileRepository } from '../src/modules/files/repositories/file.repository';
import { InMemoryShareRepository } from '../src/modules/shares/repositories/share.repository';
import { InMemorySearchHistoryRepository } from '../src/modules/search/repositories/search.repository';
import { TokenService } from '../src/modules/auth/services/token.service';
import { PasswordService } from '../src/modules/auth/services/password.service';

const userRepository = InMemoryUserRepository.getInstance();
const fileRepository = InMemoryFileRepository.getInstance();
const shareRepository = InMemoryShareRepository.getInstance();
const searchHistoryRepository = InMemorySearchHistoryRepository.getInstance();

describe('FileFlow Enterprise Search & Discovery Module Integration Tests', () => {
  let tokenA: string;
  let userAId: string;
  let tokenB: string;
  let userBId: string;

  beforeEach(async () => {
    userRepository.clear();
    fileRepository.clear();
    shareRepository.clear();
    searchHistoryRepository.clear();

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

    const userB = await userRepository.create({
      fullName: 'User B',
      email: 'b@fileflow.com',
      passwordHash: hash,
      role: 'USER',
      planType: 'FREE',
      emailVerified: true,
      accountStatus: 'ACTIVE',
    });
    userBId = userB.id;
    tokenB = TokenService.generateAccessToken({
      sub: userBId,
      email: userB.email,
      role: userB.role,
      planType: userB.planType,
    });

    // Populate Files for User A
    const f1 = await fileRepository.create({
      ownerId: userAId,
      fileName: 'annual_report.pdf',
      originalName: 'annual_report.pdf',
      fileType: 'pdf',
      mimeType: 'application/pdf',
      fileSize: 10 * 1024 * 1024,
      storagePath: 'u/a/report.pdf',
      securityScore: 90,
      favorite: true,
      status: 'ACTIVE',
      shareStatus: 'SHARED',
    });

    const f2 = await fileRepository.create({
      ownerId: userAId,
      fileName: 'setup.exe',
      originalName: 'setup.exe',
      fileType: 'exe',
      mimeType: 'application/octet-stream',
      fileSize: 120 * 1024 * 1024,
      storagePath: 'u/a/setup.exe',
      securityScore: 40,
      favorite: false,
      status: 'ACTIVE',
      shareStatus: 'PRIVATE',
    });

    const f3 = await fileRepository.create({
      ownerId: userAId,
      fileName: 'project_spec.pdf',
      originalName: 'project_spec.pdf',
      fileType: 'pdf',
      mimeType: 'application/pdf',
      fileSize: 5 * 1024 * 1024,
      storagePath: 'u/a/spec.pdf',
      securityScore: 85,
      favorite: false,
      status: 'ACTIVE',
      shareStatus: 'PRIVATE',
    });

    // Populate Shares for User A
    const s1 = await shareRepository.create({
      ownerId: userAId,
      fileId: f1.id,
      shareLink: 'http://localhost/s/token_f1_a',
      accessLevel: 'DOWNLOAD',
      shareStatus: 'ACTIVE',
      shareToken: 'token_f1_a',
      passwordProtected: false,
    });
    await shareRepository.update(s1.id, { downloadCount: 15 });

    const s2 = await shareRepository.create({
      ownerId: userAId,
      fileId: f1.id,
      shareLink: 'http://localhost/s/token_f1_b',
      accessLevel: 'DOWNLOAD',
      shareStatus: 'ACTIVE',
      shareToken: 'token_f1_b',
      passwordProtected: true,
    });
    await shareRepository.update(s2.id, { downloadCount: 10 });

    const s3 = await shareRepository.create({
      ownerId: userAId,
      fileId: f2.id,
      shareLink: 'http://localhost/s/token_f2_unprotected',
      accessLevel: 'DOWNLOAD',
      shareStatus: 'ACTIVE',
      shareToken: 'token_f2_unprotected',
      passwordProtected: false,
    });
    await shareRepository.update(s3.id, { downloadCount: 5 });
  });

  describe('GET /api/v1/search/files', () => {
    it('should search user files by name with relevance sorting', async () => {
      const response = await supertest(app)
        .get('/api/v1/search/files')
        .query({ query: 'pdf' })
        .set('Authorization', `Bearer ${tokenA}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.files).toHaveLength(2);
      expect(response.body.data.total).toBe(2);
    });

    it('should filter by fileType and favorite status', async () => {
      const response = await supertest(app)
        .get('/api/v1/search/files')
        .query({ fileType: 'pdf', favorite: 'true' })
        .set('Authorization', `Bearer ${tokenA}`);

      expect(response.status).toBe(200);
      expect(response.body.data.files).toHaveLength(1);
      expect(response.body.data.files[0].fileName).toBe('annual_report.pdf');
    });

    it('should filter by security score boundaries', async () => {
      const response = await supertest(app)
        .get('/api/v1/search/files')
        .query({ minSecurityScore: 50, maxSecurityScore: 95 })
        .set('Authorization', `Bearer ${tokenA}`);

      expect(response.status).toBe(200);
      expect(response.body.data.files).toHaveLength(2);
    });

    it('should sort by file size descending', async () => {
      const response = await supertest(app)
        .get('/api/v1/search/files')
        .query({ sortBy: 'file_size', sortOrder: 'desc' })
        .set('Authorization', `Bearer ${tokenA}`);

      expect(response.status).toBe(200);
      expect(response.body.data.files[0].fileName).toBe('setup.exe');
    });

    it('should sort by most downloaded', async () => {
      const response = await supertest(app)
        .get('/api/v1/search/files')
        .query({ sortBy: 'most_downloaded', sortOrder: 'desc' })
        .set('Authorization', `Bearer ${tokenA}`);

      expect(response.status).toBe(200);
      expect(response.body.data.files[0].fileName).toBe('annual_report.pdf');
    });
  });

  describe('GET /api/v1/search/suggestions', () => {
    it('should record search queries and return suggestions with history', async () => {
      await supertest(app)
        .get('/api/v1/search/files')
        .query({ query: 'invoice' })
        .set('Authorization', `Bearer ${tokenA}`);

      await supertest(app)
        .get('/api/v1/search/files')
        .query({ query: 'invoice' })
        .set('Authorization', `Bearer ${tokenA}`);

      await supertest(app)
        .get('/api/v1/search/files')
        .query({ query: 'budget' })
        .set('Authorization', `Bearer ${tokenA}`);

      const response = await supertest(app)
        .get('/api/v1/search/suggestions')
        .query({ query: 'ann' })
        .set('Authorization', `Bearer ${tokenA}`);

      expect(response.status).toBe(200);
      expect(response.body.data.recentSearches).toContain('budget');
      expect(response.body.data.recentSearches).toContain('invoice');
      expect(response.body.data.popularSearches[0].query).toBe('invoice');
      expect(response.body.data.suggestedFiles[0].fileName).toBe('annual_report.pdf');
    });
  });

  describe('GET /api/v1/search/discover', () => {
    it('should return grouped discovery blocks', async () => {
      const response = await supertest(app)
        .get('/api/v1/search/discover')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('recentlyModified');
      expect(response.body.data).toHaveProperty('favorites');
      expect(response.body.data).toHaveProperty('largeFiles');
      expect(response.body.data).toHaveProperty('needsAttention');

      expect(response.body.data.favorites).toHaveLength(1);
      expect(response.body.data.favorites[0].fileName).toBe('annual_report.pdf');

      expect(response.body.data.largeFiles).toHaveLength(1);
      expect(response.body.data.largeFiles[0].fileName).toBe('setup.exe');
    });
  });

  describe('GET /api/v1/search/trending', () => {
    it('should return categorized trending files', async () => {
      const response = await supertest(app)
        .get('/api/v1/search/trending')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('mostAccessed');
      expect(response.body.data).toHaveProperty('mostShared');
      expect(response.body.data).toHaveProperty('mostFavorited');
    });
  });

  describe('Security Workspace Isolation Constraints', () => {
    it('should only return files owned by the authorized user', async () => {
      const response = await supertest(app)
        .get('/api/v1/search/files')
        .query({ query: 'report' })
        .set('Authorization', `Bearer ${tokenB}`);

      expect(response.status).toBe(200);
      expect(response.body.data.files).toHaveLength(0);
    });
  });
});
