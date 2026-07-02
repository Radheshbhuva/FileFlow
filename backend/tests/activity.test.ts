import supertest from 'supertest';
import { app } from '../src/app';
import { InMemoryUserRepository } from '../src/modules/auth/repositories/user.repository';
import { InMemoryActivityRepository } from '../src/modules/activity/repositories/activity.repository';
import { TokenService } from '../src/modules/auth/services/token.service';
import { PasswordService } from '../src/modules/auth/services/password.service';
import { eventBus } from '../src/shared/event-bus';

const userRepository = InMemoryUserRepository.getInstance();
const activityRepository = InMemoryActivityRepository.getInstance();

describe('FileFlow Activity Module Integration Tests', () => {
  let tokenA: string;
  let userAId: string;

  let tokenB: string;
  let userBId: string;

  beforeEach(async () => {
    userRepository.clear();
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
  });

  describe('Event-Driven Activity Creation', () => {
    it('should create activity logs automatically upon receiving user login and file creation domain events', async () => {
      // 1. Emit login event
      eventBus.emit('user.logged_in', { userId: userAId, email: 'a@fileflow.com' });

      // 2. Emit file creation event
      eventBus.emit('file.created', { userId: userAId, fileId: 'file-uuid-abc', fileName: 'resume.pdf' });

      // Yield thread execution to let async listener write to the repository
      await new Promise((resolve) => setTimeout(resolve, 50));

      const logs = await activityRepository.findRecent(userAId, 10);
      expect(logs).toHaveLength(2);
      
      const loginLog = logs.find((l) => l.activityType === 'LOGIN');
      expect(loginLog).toBeDefined();
      expect(loginLog?.severity).toBe('INFO');
      expect(loginLog?.description).toContain('logged in');

      const fileLog = logs.find((l) => l.activityType === 'FILE_UPLOADED');
      expect(fileLog).toBeDefined();
      expect(fileLog?.resourceName).toBe('resume.pdf');
    });
  });

  describe('Activity Feed Query Gates', () => {
    beforeEach(async () => {
      // Setup mock activities in repository
      await activityRepository.create({
        userId: userAId,
        activityType: 'LOGIN',
        description: 'User A logged in',
        severity: 'INFO',
      });

      await activityRepository.create({
        userId: userAId,
        activityType: 'FILE_UPLOADED',
        description: 'User A uploaded doc.pdf',
        resourceName: 'doc.pdf',
        resourceType: 'FILE',
        severity: 'INFO',
      });

      await activityRepository.create({
        userId: userAId,
        activityType: 'PASSWORD_CHANGED',
        description: 'User A changed password',
        severity: 'CRITICAL',
      });
    });

    it('should list activities for User A with pagination and search queries', async () => {
      const res = await supertest(app)
        .get('/api/v1/activity?page=1&limit=2&search=uploaded')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.activities).toHaveLength(1);
      expect(res.body.data.activities[0].activityType).toBe('FILE_UPLOADED');
      expect(res.body.data.total).toBe(1);
    });

    it('should filter activities by severity', async () => {
      const res = await supertest(app)
        .get('/api/v1/activity?severity=CRITICAL')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.activities).toHaveLength(1);
      expect(res.body.data.activities[0].activityType).toBe('PASSWORD_CHANGED');
    });

    it('should return recent activities lists', async () => {
      const res = await supertest(app)
        .get('/api/v1/activity/recent?limit=2')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.activities).toHaveLength(2);
    });

    it('should return correct metrics summaries', async () => {
      const res = await supertest(app)
        .get('/api/v1/activity/summary')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.summary.totalActivities).toBe(3);
      expect(res.body.data.summary.uploads).toBe(1);
    });
  });

  describe('Authorization and Ownership Barriers', () => {
    let activityAId: string;

    beforeEach(async () => {
      const act = await activityRepository.create({
        userId: userAId,
        activityType: 'LOGIN',
        description: 'User A logged in',
        severity: 'INFO',
      });
      activityAId = act.id;
    });

    it('should block User B from loading User A specific feed with 403 Forbidden', async () => {
      const res = await supertest(app)
        .get(`/api/v1/activity/user/${userAId}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('permission');
    });

    it('should block User B from fetching User A specific activity record by ID', async () => {
      const res = await supertest(app)
        .get(`/api/v1/activity/${activityAId}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });
});
