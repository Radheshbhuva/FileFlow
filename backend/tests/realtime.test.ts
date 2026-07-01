import http from 'http';
import WebSocket from 'ws';
import supertest from 'supertest';
import { app } from '../src/app';
import { eventBusService } from '../src/modules/realtime/services/event-bus.service';
import { TokenService } from '../src/modules/auth/services/token.service';
import { InMemoryUserRepository } from '../src/modules/auth/repositories/user.repository';
import { InMemoryWorkspaceRepository } from '../src/modules/database/repositories/inmemory-workspace.repository';
import { uploadEventEmitter } from '../src/modules/uploads/services/upload.service';
import { shareEventEmitter } from '../src/modules/shares/services/share.service';
import { eventBus } from '../src/shared/event-bus';

describe('FileFlow Real-Time Events Layer Integration Tests', () => {
  let server: http.Server;
  const userRepo = InMemoryUserRepository.getInstance();
  const workspaceRepo = InMemoryWorkspaceRepository.getInstance();
  let tokenA: string;
  let tokenB: string;
  let userAId: string;
  let userBId: string;
  let workspaceAId: string;
  let workspaceBId: string;

  beforeAll(async () => {
    // Start test server on port 8085
    server = http.createServer(app);
    await new Promise<void>((resolve) => server.listen(8085, resolve));
    
    // Shut down default event bus instance in tests to hook custom one
    await eventBusService.shutdown();
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  beforeEach(async () => {
    userRepo.clear();
    workspaceRepo.clear();

    // Create User A
    const userA = await userRepo.create({
      fullName: 'User A',
      email: 'a@fileflow.com',
      passwordHash: 'hash',
      role: 'USER',
      planType: 'FREE',
      emailVerified: true,
      accountStatus: 'ACTIVE',
    });
    userAId = userA.id;

    // Create Workspace for User A
    const workspaceA = await workspaceRepo.create({
      name: 'Workspace A',
      ownerId: userAId,
    });
    workspaceAId = workspaceA.id;

    // Create User B
    const userB = await userRepo.create({
      fullName: 'User B',
      email: 'b@fileflow.com',
      passwordHash: 'hash',
      role: 'USER',
      planType: 'FREE',
      emailVerified: true,
      accountStatus: 'ACTIVE',
    });
    userBId = userB.id;

    // Create Workspace for User B
    const workspaceB = await workspaceRepo.create({
      name: 'Workspace B',
      ownerId: userBId,
    });
    workspaceBId = workspaceB.id;

    // Tokens
    tokenA = TokenService.generateAccessToken({
      sub: userAId,
      email: userA.email,
      role: userA.role,
      planType: userA.planType,
    });

    tokenB = TokenService.generateAccessToken({
      sub: userBId,
      email: userB.email,
      role: userB.role,
      planType: userB.planType,
    });

    // Re-initialize EventBusService attached to standalone server
    await eventBusService.initialize(server);
  });

  afterEach(async () => {
    await eventBusService.shutdown();
  });

  describe('WebSocket Handshake & Auth Checks', () => {
    it('should reject WebSocket handshake if token parameter is missing', (done) => {
      const client = new WebSocket('ws://localhost:8085');
      client.on('error', () => {
        // error expected
      });
      client.on('close', (code, reason) => {
        expect(code).toBe(4001); // Unauthorized
        done();
      });
    });

    it('should reject connection if token is invalid', (done) => {
      const client = new WebSocket('ws://localhost:8085?token=invalid-token');
      client.on('error', () => {
        // error expected
      });
      client.on('close', (code, reason) => {
        expect(code).toBe(4002); // Handshake Auth fail
        done();
      });
    });

    it('should connect User A successfully and receive confirmation', (done) => {
      const client = new WebSocket(`ws://localhost:8085?token=${tokenA}`);
      client.on('message', (data) => {
        const payload = JSON.parse(data.toString());
        expect(payload.success).toBe(true);
        expect(payload.message).toContain('Connected');
        expect(payload.data.userId).toBe(userAId);
        client.close();
        done();
      });
    });
  });

  describe('Workspace Isolation & Channel Subscriptions', () => {
    it('should automatically subscribe User A to their own workspace channel', (done) => {
      const client = new WebSocket(`ws://localhost:8085?token=${tokenA}`);
      
      client.on('open', () => {
        // Publish event to workspace A
        setTimeout(() => {
          eventBusService.publishEvent({
            eventType: 'FILE_UPLOADED',
            workspaceId: workspaceAId,
            userId: userAId,
            payload: { fileId: '123' },
          });
        }, 50);
      });

      client.on('message', (data) => {
        const payload = JSON.parse(data.toString());
        // Skip first welcome message
        if (payload.message && payload.message.includes('Connected')) return;

        if (payload.channel === `workspace:${workspaceAId}` && payload.data.eventType === 'FILE_UPLOADED') {
          client.close();
          done();
        }
      });
    });

    it('should reject User A subscription request to User B workspace channel', (done) => {
      const client = new WebSocket(`ws://localhost:8085?token=${tokenA}`);

      client.on('message', (data) => {
        const payload = JSON.parse(data.toString());
        if (payload.message && payload.message.includes('Connected')) {
          // Attempt subscribing to Workspace B
          client.send(JSON.stringify({
            action: 'subscribe',
            channel: `workspace:${workspaceBId}`,
          }));
          return;
        }

        expect(payload.success).toBe(false);
        expect(payload.error).toContain('Unauthorized subscription');
        client.close();
        done();
      });
    });
  });

  describe('Server-Sent Events streaming client', () => {
    it('should establish an active text/event-stream connection', (done) => {
      const req = http.get(`http://localhost:8085/api/v1/realtime/stream?token=${tokenA}`, (res) => {
        expect(res.headers['content-type']).toContain('text/event-stream');
        expect(res.statusCode).toBe(200);

        res.on('data', (chunk) => {
          const text = chunk.toString();
          if (text.includes('Connected to FileFlow SSE stream')) {
            req.destroy(); // Terminate infinite stream connection
            done();
          }
        });
      });
    });

    it('should return 401 if token query parameter is missing on SSE stream', async () => {
      const response = await supertest(app)
        .get('/api/v1/realtime/stream')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Domain Events Listener Integration Bridge', () => {
    it('should trigger FILE_UPLOADED real-time event when uploadEventEmitter completes', (done) => {
      const client = new WebSocket(`ws://localhost:8085?token=${tokenA}`);
      let isDone = false;

      client.on('open', () => {
        // Trigger local domain event
        setTimeout(() => {
          uploadEventEmitter.emit('uploadCompleted', {
            userId: userAId,
            uploadId: 'upload-uuid',
            fileId: 'file-uuid-completed',
          });
        }, 50);
      });

      client.on('message', (data) => {
        const payload = JSON.parse(data.toString());
        if (payload.message && payload.message.includes('Connected')) return;

        // Dashboard automatically updates too, look specifically for FILE_UPLOADED trigger
        if (
          payload.data &&
          payload.data.eventType === 'DASHBOARD_UPDATED' &&
          payload.data.payload.triggerEventType === 'FILE_UPLOADED' &&
          !isDone
        ) {
          isDone = true;
          client.close();
          done();
        }
      });
    });

    it('should trigger FILE_SHARED real-time event when shareEventEmitter created', (done) => {
      const client = new WebSocket(`ws://localhost:8085?token=${tokenA}`);
      let isDone = false;

      client.on('open', () => {
        setTimeout(() => {
          shareEventEmitter.emit('shareCreated', {
            ownerId: userAId,
            shareId: 'share-123',
            fileId: 'file-123',
          });
        }, 50);
      });

      client.on('message', (data) => {
        const payload = JSON.parse(data.toString());
        if (payload.message && payload.message.includes('Connected')) return;

        // Look specifically for FILE_SHARED trigger
        if (
          payload.data &&
          payload.data.eventType === 'DASHBOARD_UPDATED' &&
          payload.data.payload.triggerEventType === 'FILE_SHARED' &&
          !isDone
        ) {
          isDone = true;
          client.close();
          done();
        }
      });
    });

    it('should trigger FILE_DELETED real-time event when file.deleted is emitted on eventBus', (done) => {
      const client = new WebSocket(`ws://localhost:8085?token=${tokenA}`);
      let isDone = false;

      client.on('open', () => {
        setTimeout(() => {
          eventBus.emit('file.deleted', {
            userId: userAId,
            fileId: 'trash-file',
            fileName: 'trash.png',
          });
        }, 50);
      });

      client.on('message', (data) => {
        const payload = JSON.parse(data.toString());
        if (payload.message && payload.message.includes('Connected')) return;

        if (payload.data && payload.data.eventType === 'FILE_DELETED' && !isDone) {
          isDone = true;
          expect(payload.data.payload.fileId).toBe('trash-file');
          client.close();
          done();
        }
      });
    });
  });
});
