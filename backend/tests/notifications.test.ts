import supertest from 'supertest';
import { app } from '../src/app';
import { InMemoryUserRepository } from '../src/modules/auth/repositories/user.repository';
import { InMemoryFileRepository } from '../src/modules/files/repositories/file.repository';
import { InMemoryShareRepository } from '../src/modules/shares/repositories/share.repository';
import { InMemoryNotificationRepository } from '../src/modules/notifications/repositories/notification.repository';
import { TokenService } from '../src/modules/auth/services/token.service';
import { PasswordService } from '../src/modules/auth/services/password.service';
import { eventBus } from '../src/shared/event-bus';
import { shareEventEmitter } from '../src/modules/shares/services/share.service';
import { NotificationService } from '../src/modules/notifications/services/notification.service';

const userRepository = InMemoryUserRepository.getInstance();
const fileRepository = InMemoryFileRepository.getInstance();
const shareRepository = InMemoryShareRepository.getInstance();
const notificationRepository = InMemoryNotificationRepository.getInstance();
const notificationService = new NotificationService();

describe('FileFlow Notification Module Integration Tests', () => {
  let tokenA: string;
  let userAId: string;

  let tokenB: string;
  let userBId: string;

  beforeEach(async () => {
    userRepository.clear();
    fileRepository.clear();
    shareRepository.clear();
    notificationRepository.clear();

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

    // Setup initial storage quota limits for User A (100 MB)
    await userRepository.update(userAId, {
      storageUsed: 1024 * 1024 * 10, // 10 MB (10%)
      storageLimit: 1024 * 1024 * 100, // 100 MB Limit
    });

    // Create User B (for isolation checks)
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

  describe('Event-Driven Automatic Notification Generation', () => {
    it('should generate FILE_UPLOADED notification automatically on file.created event', async () => {
      // Emit file.created event
      eventBus.emit('file.created', {
        userId: userAId,
        fileId: 'file-1',
        fileName: 'contract.pdf',
        securityScore: 85,
      });

      // Let listener process event
      await new Promise((resolve) => setTimeout(resolve, 50));

      const notifications = await notificationRepository.findAll(userAId);
      expect(notifications).toHaveLength(1);
      expect(notifications[0].notificationType).toBe('FILE_UPLOADED');
      expect(notifications[0].severity).toBe('SUCCESS');
      expect(notifications[0].title).toContain('Uploaded');
    });

    it('should generate SECURITY_ALERT if file.created security rating is low (<50)', async () => {
      eventBus.emit('file.created', {
        userId: userAId,
        fileId: 'file-exe',
        fileName: 'dangerous.exe',
        securityScore: 40, // < 50 is CRITICAL risk
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const notifications = await notificationRepository.findAll(userAId);
      // Generates both FILE_UPLOADED and SECURITY_ALERT notifications
      expect(notifications).toHaveLength(2);
      
      const alert = notifications.find((n) => n.notificationType === 'SECURITY_ALERT');
      expect(alert).toBeDefined();
      expect(alert!.severity).toBe('CRITICAL');
      expect(alert!.message).toContain('dangerous.exe');
    });

    it('should generate PASSWORD_CHANGED alert on user.password_changed event', async () => {
      eventBus.emit('user.password_changed', { userId: userAId });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const notifications = await notificationRepository.findAll(userAId);
      expect(notifications).toHaveLength(1);
      expect(notifications[0].notificationType).toBe('PASSWORD_CHANGED');
      expect(notifications[0].severity).toBe('CRITICAL');
    });
  });

  describe('Storage alerts Threshold Warning triggers & Throttling', () => {
    it('should generate warning notifications when storage exceeds 80%', async () => {
      // Simulate storage used at 81MB
      await userRepository.update(userAId, {
        storageUsed: 1024 * 1024 * 81,
      });

      eventBus.emit('file.created', {
        userId: userAId,
        fileId: 'file-ok',
        fileName: 'photo.jpg',
        securityScore: 90,
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const notifications = await notificationRepository.findAll(userAId);
      const storageAlert = notifications.find((n) => n.notificationType === 'STORAGE_WARNING');
      expect(storageAlert).toBeDefined();
      expect(storageAlert!.severity).toBe('WARNING');
      expect(storageAlert!.title).toContain('Running Low');
    });

    it('should generate critical alert notifications when storage exceeds 90%', async () => {
      // Simulate storage used at 91MB
      await userRepository.update(userAId, {
        storageUsed: 1024 * 1024 * 91,
      });

      eventBus.emit('file.created', {
        userId: userAId,
        fileId: 'file-ok',
        fileName: 'photo.jpg',
        securityScore: 90,
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const notifications = await notificationRepository.findAll(userAId);
      const storageAlert = notifications.find((n) => n.notificationType === 'STORAGE_WARNING');
      expect(storageAlert).toBeDefined();
      expect(storageAlert!.severity).toBe('CRITICAL');
      expect(storageAlert!.title).toContain('Limit Exhausted');
    });

    it('should throttle and prevent duplicate storage alert creation if an unread alert already exists', async () => {
      // Simulate storage used at 92MB
      await userRepository.update(userAId, {
        storageUsed: 1024 * 1024 * 92,
      });

      // Trigger 1st alert
      eventBus.emit('file.created', {
        userId: userAId,
        fileId: 'file-1',
        fileName: 'photo1.jpg',
        securityScore: 90,
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Trigger 2nd upload (remains high)
      eventBus.emit('file.created', {
        userId: userAId,
        fileId: 'file-2',
        fileName: 'photo2.jpg',
        securityScore: 90,
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const notifications = await notificationRepository.findAll(userAId);
      const storageWarningsCount = notifications.filter((n) => n.notificationType === 'STORAGE_WARNING').length;
      
      // Should have generated only 1 storage alert due to throttling
      expect(storageWarningsCount).toBe(1);
    });
  });

  describe('Unread Management & Update status Actions', () => {
    let mockNotifyId: string;

    beforeEach(async () => {
      const notification = await notificationService.createNotification(userAId, {
        notificationType: 'FILE_UPLOADED',
        title: 'Uploaded document',
        message: 'Shared file uploaded',
        severity: 'INFO',
      });
      mockNotifyId = notification!.id;
    });

    it('should list user notifications and support filtering by status', async () => {
      const res = await supertest(app)
        .get('/api/v1/notifications?status=UNREAD')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.notifications).toHaveLength(1);
      expect(res.body.data.notifications[0].id).toBe(mockNotifyId);
    });

    it('should list unread notifications directly via /unread helper path', async () => {
      const res = await supertest(app)
        .get('/api/v1/notifications/unread')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.notifications).toHaveLength(1);
    });

    it('should mark a notification as read and set readAt timestamp', async () => {
      const res = await supertest(app)
        .patch(`/api/v1/notifications/${mockNotifyId}/read`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.notification.status).toBe('READ');
      expect(res.body.data.notification.readAt).toBeDefined();
    });

    it('should bulk mark all user notifications as read', async () => {
      // Add another notification
      await notificationService.createNotification(userAId, {
        notificationType: 'PROFILE_UPDATED',
        title: 'Profile Updated',
        message: 'Settings updated',
        severity: 'INFO',
      });

      const res = await supertest(app)
        .patch('/api/v1/notifications/read-all')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.count).toBe(2);

      const unreadRes = await supertest(app)
        .get('/api/v1/notifications/unread')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(unreadRes.body.data.notifications).toHaveLength(0);
    });

    it('should archive a notification changing status to ARCHIVED', async () => {
      const res = await supertest(app)
        .patch(`/api/v1/notifications/${mockNotifyId}/archive`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.notification.status).toBe('ARCHIVED');
    });
  });

  describe('GET /api/v1/notifications/summary', () => {
    it('should return totals, unread counts, and critical flags', async () => {
      // 1. Create Info Unread
      await notificationService.createNotification(userAId, {
        notificationType: 'FILE_UPLOADED',
        title: 'File upload',
        message: 'File uploaded',
        severity: 'INFO',
      });

      // 2. Create Critical Unread
      await notificationService.createNotification(userAId, {
        notificationType: 'PASSWORD_CHANGED',
        title: 'Password change alert',
        message: 'Password changed',
        severity: 'CRITICAL',
      });

      const res = await supertest(app)
        .get('/api/v1/notifications/summary')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.summary.totalNotifications).toBe(2);
      expect(res.body.data.summary.unreadCount).toBe(2);
      expect(res.body.data.summary.criticalAlertsCount).toBe(1);
    });
  });

  describe('Isolation and Authorization Barriers', () => {
    let mockNotifyId: string;

    beforeEach(async () => {
      const notification = await notificationService.createNotification(userAId, {
        notificationType: 'FILE_UPLOADED',
        title: 'User A notification',
        message: 'Private logs',
        severity: 'INFO',
      });
      mockNotifyId = notification!.id;
    });

    it('should isolate notification queries preventing User B from viewing User A list', async () => {
      const res = await supertest(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(200);
      expect(res.body.data.notifications).toHaveLength(0);
    });

    it('should block User B from reading User A notification details with 403 Forbidden', async () => {
      const res = await supertest(app)
        .get(`/api/v1/notifications/${mockNotifyId}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(403);
    });

    it('should block User B from updating User A notification status with 403 Forbidden', async () => {
      const res = await supertest(app)
        .patch(`/api/v1/notifications/${mockNotifyId}/read`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(403);
    });
  });
});
