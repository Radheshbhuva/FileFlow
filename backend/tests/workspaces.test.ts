import supertest from 'supertest';
import { app } from '../src/app';
import { TokenService } from '../src/modules/auth/services/token.service';
import { InMemoryUserRepository } from '../src/modules/auth/repositories/user.repository';
import { PasswordService } from '../src/modules/auth/services/password.service';
import { InMemoryWorkspaceRepository } from '../src/modules/database/repositories/inmemory-workspace.repository';

const userRepository = InMemoryUserRepository.getInstance();
const workspaceRepository = InMemoryWorkspaceRepository.getInstance();

describe('FileFlow Enterprise Team Workspace Module Tests', () => {
  let tokenA: string;
  let tokenB: string;
  let userAId: string;
  let userBId: string;
  let emailA = 'userA@fileflow.com';
  let emailB = 'userB@fileflow.com';

  beforeEach(async () => {
    userRepository.clear();
    workspaceRepository.clear();

    const hash = await PasswordService.hash('Password123!');

    // Create User A (Owner)
    const userA = await userRepository.create({
      fullName: 'User A',
      email: emailA,
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

    // Create User B (Member)
    const userB = await userRepository.create({
      fullName: 'User B',
      email: emailB,
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
  });

  describe('Workspace CRUD & Lifecycle Operations', () => {
    it('POST /api/v1/workspaces should create workspace and assign OWNER role', async () => {
      const response = await supertest(app)
        .post('/api/v1/workspaces')
        .send({
          name: 'Acme Corp',
          slug: 'acme-corp',
          description: 'Acme Corporate Workspace',
        })
        .set('Authorization', `Bearer ${tokenA}`);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Acme Corp');
      expect(response.body.data.slug).toBe('acme-corp');
      expect(response.body.data.ownerId).toBe(userAId);

      // Verify owner membership was created
      const workspaceId = response.body.data.id;
      const member = await workspaceRepository.findMember(workspaceId, userAId);
      expect(member).toBeDefined();
      expect(member?.role).toBe('OWNER');
    });

    it('POST /api/v1/workspaces should fail if slug is already taken', async () => {
      // Create first workspace
      await supertest(app)
        .post('/api/v1/workspaces')
        .send({ name: 'Acme Corp', slug: 'acme-corp' })
        .set('Authorization', `Bearer ${tokenA}`);

      // Try creating second one with same slug
      const response = await supertest(app)
        .post('/api/v1/workspaces')
        .send({ name: 'Acme Corporate', slug: 'acme-corp' })
        .set('Authorization', `Bearer ${tokenB}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already taken');
    });

    it('GET /api/v1/workspaces should return workspaces where user is active member', async () => {
      // User A creates workspace
      const createRes = await supertest(app)
        .post('/api/v1/workspaces')
        .send({ name: 'Acme Corp', slug: 'acme-corp' })
        .set('Authorization', `Bearer ${tokenA}`);
      const workspaceId = createRes.body.data.id;

      // GET for User A should return 1 workspace
      const resA = await supertest(app)
        .get('/api/v1/workspaces')
        .set('Authorization', `Bearer ${tokenA}`);
      expect(resA.status).toBe(200);
      expect(resA.body.data.length).toBe(1);
      expect(resA.body.data[0].id).toBe(workspaceId);

      // GET for User B should return 0 workspaces
      const resB = await supertest(app)
        .get('/api/v1/workspaces')
        .set('Authorization', `Bearer ${tokenB}`);
      expect(resB.status).toBe(200);
      expect(resB.body.data.length).toBe(0);
    });
  });

  describe('Invitations and Member Management Flow', () => {
    let workspaceId: string;

    beforeEach(async () => {
      // Create workspace for User A
      const createRes = await supertest(app)
        .post('/api/v1/workspaces')
        .send({ name: 'Acme Corp', slug: 'acme-corp' })
        .set('Authorization', `Bearer ${tokenA}`);
      workspaceId = createRes.body.data.id;
    });

    it('POST /:id/invite and POST /accept should complete invitation lifecycle', async () => {
      // 1. Send invite
      const inviteRes = await supertest(app)
        .post(`/api/v1/workspaces/${workspaceId}/invite`)
        .send({
          email: emailB,
          role: 'MANAGER',
        })
        .set('Authorization', `Bearer ${tokenA}`);

      expect(inviteRes.status).toBe(200);
      expect(inviteRes.body.success).toBe(true);
      expect(inviteRes.body.data.status).toBe('PENDING');
      expect(inviteRes.body.data.role).toBe('MANAGER');

      const inviteToken = inviteRes.body.data.inviteToken;
      expect(inviteToken).toBeDefined();

      // 2. Accept invite using token
      const acceptRes = await supertest(app)
        .post('/api/v1/workspaces/accept')
        .send({ token: inviteToken })
        .set('Authorization', `Bearer ${tokenB}`);

      expect(acceptRes.status).toBe(200);
      expect(acceptRes.body.success).toBe(true);
      expect(acceptRes.body.data.role).toBe('MANAGER');

      // 3. Retrieve members list
      const membersRes = await supertest(app)
        .get(`/api/v1/workspaces/${workspaceId}/members`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(membersRes.status).toBe(200);
      expect(membersRes.body.data.length).toBe(2);
      expect(membersRes.body.data.some((m: any) => m.userId === userBId)).toBe(true);
    });

    it('POST /accept should block acceptance if invite email does not match user email', async () => {
      // Invite user B
      const inviteRes = await supertest(app)
        .post(`/api/v1/workspaces/${workspaceId}/invite`)
        .send({ email: emailB, role: 'MEMBER' })
        .set('Authorization', `Bearer ${tokenA}`);

      const inviteToken = inviteRes.body.data.inviteToken;

      // Accept with User A token instead of User B
      const acceptRes = await supertest(app)
        .post('/api/v1/workspaces/accept')
        .send({ token: inviteToken })
        .set('Authorization', `Bearer ${tokenA}`);

      expect(acceptRes.status).toBe(403);
      expect(acceptRes.body.message).toContain('not assigned to your account');
    });
  });

  describe('Role-Based Access Control (RBAC) Verification', () => {
    let workspaceId: string;

    beforeEach(async () => {
      // Create workspace for User A
      const createRes = await supertest(app)
        .post('/api/v1/workspaces')
        .send({ name: 'Acme Corp', slug: 'acme-corp' })
        .set('Authorization', `Bearer ${tokenA}`);
      workspaceId = createRes.body.data.id;

      // User B joins as MEMBER (has files.upload/share/download, but not workspace.settings)
      const member = {
        id: 'member-b-id',
        workspaceId,
        userId: userBId,
        role: 'MEMBER' as const,
        status: 'ACTIVE' as const,
        permissions: ['files.upload', 'files.share', 'files.download'],
        joinedAt: new Date(),
        lastActiveAt: new Date(),
      };
      await workspaceRepository.createMember(member);
    });

    it('should block non-members from accessing workspace resources', async () => {
      const userC = await userRepository.create({
        fullName: 'User C',
        email: 'c@fileflow.com',
        passwordHash: 'dummyhash',
        role: 'USER',
        planType: 'FREE',
        emailVerified: true,
        accountStatus: 'ACTIVE',
      });

      const tokenC = TokenService.generateAccessToken({
        sub: userC.id,
        email: userC.email,
        role: userC.role,
        planType: userC.planType,
      });

      const response = await supertest(app)
        .get(`/api/v1/workspaces/${workspaceId}`)
        .set('Authorization', `Bearer ${tokenC}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('do not have access');
    });

    it('should block MEMBER from editing workspace settings', async () => {
      const response = await supertest(app)
        .patch(`/api/v1/workspaces/${workspaceId}`)
        .send({ name: 'Renamed Corporate' })
        .set('Authorization', `Bearer ${tokenB}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('Missing required permission');
    });

    it('should allow OWNER to edit workspace settings', async () => {
      const response = await supertest(app)
        .patch(`/api/v1/workspaces/${workspaceId}`)
        .send({ name: 'Acme Corporate Updated' })
        .set('Authorization', `Bearer ${tokenA}`);

      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe('Acme Corporate Updated');
    });
  });
});
