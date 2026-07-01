import supertest from 'supertest';
import { app } from '../src/app';
import { InMemoryUserRepository } from '../src/modules/auth/repositories/user.repository';
import { TokenService } from '../src/modules/auth/services/token.service';
import { PasswordService } from '../src/modules/auth/services/password.service';

const userRepository = InMemoryUserRepository.getInstance();

describe('FileFlow User Profile Module Integration Tests', () => {
  let authToken: string;
  let userId: string;

  const initialPassword = 'Password123!';

  beforeEach(async () => {
    userRepository.clear();

    const passwordHash = await PasswordService.hash(initialPassword);
    const user = await userRepository.create({
      fullName: 'Jane Doe',
      email: 'jane@fileflow.com',
      passwordHash,
      role: 'USER',
      planType: 'FREE',
      emailVerified: true,
      accountStatus: 'ACTIVE',
    });

    userId = user.id;

    authToken = TokenService.generateAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      planType: user.planType,
    });
  });

  describe('GET /api/v1/users/me', () => {
    it('should retrieve user profile successfully when authenticated', async () => {
      const res = await supertest(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('jane@fileflow.com');
      expect(res.body.data.user.fullName).toBe('Jane Doe');
      expect(res.body.data.user.passwordHash).toBeUndefined();
    });

    it('should block profile retrieval with 401 if token is missing', async () => {
      const res = await supertest(app).get('/api/v1/users/me');
      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/v1/users/profile', () => {
    it('should update profile fields successfully', async () => {
      const updates = {
        fullName: 'Jane Smith',
        timezone: 'America/New_York',
        company: 'Growth Co.',
        jobTitle: 'Lead Architect',
      };

      const res = await supertest(app)
        .put('/api/v1/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updates);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.fullName).toBe(updates.fullName);
      expect(res.body.data.user.timezone).toBe(updates.timezone);
      expect(res.body.data.user.company).toBe(updates.company);
      expect(res.body.data.user.jobTitle).toBe(updates.jobTitle);

      const dbUser = await userRepository.findById(userId);
      expect(dbUser?.fullName).toBe(updates.fullName);
    });

    it('should fail profile update if inputs fail schema rules', async () => {
      const res = await supertest(app)
        .put('/api/v1/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ avatar: 'not-a-valid-url' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/v1/users/avatar', () => {
    it('should update user avatar successfully', async () => {
      const avatarUrl = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256';

      const res = await supertest(app)
        .put('/api/v1/users/avatar')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ avatar: avatarUrl });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.avatar).toBe(avatarUrl);
    });
  });

  describe('PUT /api/v1/users/change-password', () => {
    it('should change password successfully when current password is valid', async () => {
      const newPassword = 'NewSecretPassword99!';

      const res = await supertest(app)
        .put('/api/v1/users/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: initialPassword,
          newPassword,
          confirmPassword: newPassword,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const loginRes = await supertest(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'jane@fileflow.com',
          password: newPassword,
        });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.success).toBe(true);
    });

    it('should fail password change if current password is incorrect', async () => {
      const newPassword = 'NewSecretPassword99!';

      const res = await supertest(app)
        .put('/api/v1/users/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'WrongPassword!',
          newPassword,
          confirmPassword: newPassword,
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Incorrect current password');
    });
  });

  describe('GET /api/v1/users/storage', () => {
    it('should calculate storage analytics correctly', async () => {
      const storageUsed = 2 * 1024 * 1024 * 1024; // 2 GB
      const storageLimit = 5 * 1024 * 1024 * 1024; // 5 GB
      await userRepository.update(userId, { storageUsed, storageLimit });

      const res = await supertest(app)
        .get('/api/v1/users/storage')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.storage.storageUsed).toBe(storageUsed);
      expect(res.body.data.storage.storageLimit).toBe(storageLimit);
      expect(res.body.data.storage.usagePercentage).toBe(40.00);
      expect(res.body.data.storage.remainingStorage).toBe(3 * 1024 * 1024 * 1024);
    });
  });

  describe('GET /api/v1/users/activity-summary', () => {
    it('should return correct dashboard activity summary metrics', async () => {
      const metrics = {
        filesUploadedCount: 15,
        filesSharedCount: 3,
        favoritesCount: 6,
        recentActivityCount: 10,
      };
      await userRepository.update(userId, metrics);

      const res = await supertest(app)
        .get('/api/v1/users/activity-summary')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.summary.filesUploaded).toBe(metrics.filesUploadedCount);
      expect(res.body.data.summary.filesShared).toBe(metrics.filesSharedCount);
      expect(res.body.data.summary.favoritesCount).toBe(metrics.favoritesCount);
      expect(res.body.data.summary.recentActivityCount).toBe(metrics.recentActivityCount);
    });
  });
});
