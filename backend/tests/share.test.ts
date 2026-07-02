import supertest from 'supertest';
import { app } from '../src/app';
import { InMemoryUserRepository } from '../src/modules/auth/repositories/user.repository';
import { InMemoryFileRepository } from '../src/modules/files/repositories/file.repository';
import { InMemoryShareRepository } from '../src/modules/shares/repositories/share.repository';
import { TokenService } from '../src/modules/auth/services/token.service';
import { PasswordService } from '../src/modules/auth/services/password.service';

const userRepository = InMemoryUserRepository.getInstance();
const fileRepository = InMemoryFileRepository.getInstance();
const shareRepository = InMemoryShareRepository.getInstance();

describe('FileFlow Share Module Integration Tests', () => {
  let tokenA: string;
  let userAId: string;

  let tokenB: string;
  let userBId: string;

  let fileAId: string;

  beforeEach(async () => {
    userRepository.clear();
    fileRepository.clear();
    shareRepository.clear();

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

    // Create a mock file owned by User A
    const file = await fileRepository.create({
      ownerId: userAId,
      fileName: 'secrets.pdf',
      originalName: 'secrets.pdf',
      fileType: 'pdf',
      mimeType: 'application/pdf',
      fileSize: 1024 * 1024,
      storagePath: 'users/user-a/files/secrets.pdf',
      securityScore: 100,
      favorite: false,
      status: 'ACTIVE',
      shareStatus: 'PRIVATE',
    });
    fileAId = file.id;
  });

  describe('POST /api/v1/shares', () => {
    it('should generate a sharing configuration and deduct points from the file security score', async () => {
      const payload = {
        fileId: fileAId,
        accessLevel: 'DOWNLOAD',
        password: 'securePassword123',
        expiryDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 1 day future
        maxDownloads: 5,
      };

      const res = await supertest(app)
        .post('/api/v1/shares')
        .set('Authorization', `Bearer ${tokenA}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.share.shareToken).toBeDefined();
      expect(res.body.data.share.shareLink).toContain('/sh/');
      expect(res.body.data.share.passwordProtected).toBe(true);

      // Verify file security score drops.
      // Shared penalty: -15. But this share HAS a password, expiry, and download limit,
      // so it should ONLY suffer the base SHARED penalty of 15. Final score = 85.
      const updatedFile = await fileRepository.findById(fileAId);
      expect(updatedFile?.shareStatus).toBe('SHARED');
      expect(updatedFile?.securityScore).toBe(85);
    });

    it('should deduct maximum sharing penalty (-40 points) if share link is completely unprotected', async () => {
      const payload = {
        fileId: fileAId,
        accessLevel: 'VIEW',
      };

      const res = await supertest(app)
        .post('/api/v1/shares')
        .set('Authorization', `Bearer ${tokenA}`)
        .send(payload);

      expect(res.status).toBe(201);

      // Penalty check: shared (-15) + unprotected (-10) + no expiry (-10) + no limits (-5) = -40
      const updatedFile = await fileRepository.findById(fileAId);
      expect(updatedFile?.securityScore).toBe(60);
    });

    it('should block User B from generating a share link for User A file', async () => {
      const payload = {
        fileId: fileAId,
        accessLevel: 'VIEW',
      };

      const res = await supertest(app)
        .post('/api/v1/shares')
        .set('Authorization', `Bearer ${tokenB}`)
        .send(payload);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Public Share Flow', () => {
    let activeToken: string;
    let passwordToken: string;

    beforeEach(async () => {
      // 1. Standard active unprotected share
      const share1 = await shareRepository.create({
        fileId: fileAId,
        ownerId: userAId,
        shareToken: 'public-token-1',
        shareLink: 'http://localhost/sh/public-token-1',
        accessLevel: 'DOWNLOAD',
        shareStatus: 'ACTIVE',
        passwordProtected: false,
      });
      activeToken = share1.shareToken;

      // 2. Password protected share
      const passwordHash = await PasswordService.hash('lock123');
      const share2 = await shareRepository.create({
        fileId: fileAId,
        ownerId: userAId,
        shareToken: 'password-token-2',
        shareLink: 'http://localhost/sh/password-token-2',
        accessLevel: 'DOWNLOAD',
        shareStatus: 'ACTIVE',
        passwordProtected: true,
        passwordHash,
      });
      passwordToken = share2.shareToken;
    });

    it('should allow public lookup for active unprotected share links', async () => {
      const res = await supertest(app).get(`/api/v1/shares/public/${activeToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.share.passwordProtected).toBe(false);
      expect(res.body.data.file.fileName).toBe('secrets.pdf');
    });

    it('should fail public download if password is required but no token is passed', async () => {
      const res = await supertest(app).post(`/api/v1/shares/public/${passwordToken}/download`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('password verification');
    });

    it('should verify password and download successfully with the verification token', async () => {
      // 1. Verify password
      const verifyRes = await supertest(app)
        .post(`/api/v1/shares/public/${passwordToken}/verify`)
        .send({ password: 'lock123' });

      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.data.success).toBe(true);
      const signatureToken = verifyRes.body.data.verificationToken;

      // 2. Download using signature token in header
      const downloadRes = await supertest(app)
        .post(`/api/v1/shares/public/${passwordToken}/download`)
        .set('x-share-token', signatureToken);

      expect(downloadRes.status).toBe(200);
      expect(downloadRes.body.data.downloadUrl).toContain('amazonaws.com');
    });
  });

  describe('Share Revocation and Limits Enforcement', () => {
    let shareId: string;
    let shareToken: string;

    beforeEach(async () => {
      const share = await shareRepository.create({
        fileId: fileAId,
        ownerId: userAId,
        shareToken: 'limits-token',
        shareLink: 'http://localhost/sh/limits-token',
        accessLevel: 'DOWNLOAD',
        shareStatus: 'ACTIVE',
        passwordProtected: false,
        maxDownloads: 1,
      });
      shareId = share.id;
      shareToken = share.shareToken;
    });

    it('should immediately revoke share link access', async () => {
      const revokeRes = await supertest(app)
        .patch(`/api/v1/shares/${shareId}/revoke`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(revokeRes.status).toBe(200);
      expect(revokeRes.body.data.share.shareStatus).toBe('REVOKED');

      // Verify public access is denied
      const lookupRes = await supertest(app).get(`/api/v1/shares/public/${shareToken}`);
      expect(lookupRes.status).toBe(400);
    });

    it('should block downloads once download limits are exceeded', async () => {
      // First download should succeed and transition status to EXPIRED (limit was 1)
      const dlRes1 = await supertest(app).post(`/api/v1/shares/public/${shareToken}/download`);
      expect(dlRes1.status).toBe(200);

      // Second download should block with 400 Bad Request
      const dlRes2 = await supertest(app).post(`/api/v1/shares/public/${shareToken}/download`);
      expect(dlRes2.status).toBe(400);
    });
  });

  describe('GET /api/v1/shares/analytics', () => {
    it('should calculate sharing count metrics', async () => {
      await shareRepository.create({
        fileId: fileAId,
        ownerId: userAId,
        shareToken: 'token-an-1',
        shareLink: 'http://localhost/sh/token-an-1',
        accessLevel: 'DOWNLOAD',
        shareStatus: 'ACTIVE',
        passwordProtected: false,
      });

      const res = await supertest(app)
        .get('/api/v1/shares/analytics')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.analytics.totalShares).toBe(1);
      expect(res.body.data.analytics.activeShares).toBe(1);
    });
  });
});
