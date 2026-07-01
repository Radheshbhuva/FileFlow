import supertest from 'supertest';
import { app } from '../src/app';
import { InMemoryUserRepository } from '../src/modules/auth/repositories/user.repository';
import { TokenService } from '../src/modules/auth/services/token.service';

const userRepository = InMemoryUserRepository.getInstance();

describe('FileFlow Authentication Module Integration Tests', () => {
  beforeEach(() => {
    userRepository.clear();
  });

  const validUser = {
    fullName: 'Jane Doe',
    email: 'jane@fileflow.com',
    password: 'Password123!',
    confirmPassword: 'Password123!',
  };

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully with pending verification', async () => {
      const res = await supertest(app)
        .post('/api/v1/auth/register')
        .send(validUser);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(validUser.email);
      expect(res.body.data.user.passwordHash).toBeUndefined();
      expect(res.body.data.user.accountStatus).toBe('PENDING_VERIFICATION');
      expect(res.body.data.user.emailVerified).toBe(false);

      const dbUser = await userRepository.findByEmail(validUser.email);
      expect(dbUser).toBeDefined();
      expect(dbUser?.fullName).toBe(validUser.fullName);
    });

    it('should fail registration if email is duplicate', async () => {
      await supertest(app).post('/api/v1/auth/register').send(validUser);
      const res = await supertest(app).post('/api/v1/auth/register').send(validUser);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already exists');
    });

    it('should fail validation if passwords mismatch', async () => {
      const res = await supertest(app)
        .post('/api/v1/auth/register')
        .send({
          ...validUser,
          confirmPassword: 'WrongPassword123!',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toContainEqual(
        expect.objectContaining({
          field: 'body.confirmPassword',
          message: 'Passwords do not match',
        })
      );
    });

    it('should fail validation if password is too weak', async () => {
      const res = await supertest(app)
        .post('/api/v1/auth/register')
        .send({
          ...validUser,
          password: '123',
          confirmPassword: '123',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      await supertest(app).post('/api/v1/auth/register').send(validUser);
    });

    it('should login successfully and return access token', async () => {
      const res = await supertest(app)
        .post('/api/v1/auth/login')
        .send({
          email: validUser.email,
          password: validUser.password,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe(validUser.email);
    });

    it('should fail login if password is incorrect', async () => {
      const res = await supertest(app)
        .post('/api/v1/auth/login')
        .send({
          email: validUser.email,
          password: 'IncorrectPassword!',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid email or password');
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should return profile successfully for authenticated request', async () => {
      const registerRes = await supertest(app).post('/api/v1/auth/register').send(validUser);
      const userId = registerRes.body.data.user.id;

      const token = TokenService.generateAccessToken({
        sub: userId,
        email: validUser.email,
        role: 'USER',
        planType: 'FREE',
      });

      const res = await supertest(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(validUser.email);
    });

    it('should fail with 401 if token is missing', async () => {
      const res = await supertest(app).get('/api/v1/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('not logged in');
    });

    it('should fail with 401 if token is invalid', async () => {
      const res = await supertest(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token-string');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Verification & Password Recovery Flows', () => {
    it('should verify email successfully with token', async () => {
      await supertest(app).post('/api/v1/auth/register').send(validUser);
      const user = await userRepository.findByEmail(validUser.email);
      const token = user?.verificationToken;

      expect(token).toBeDefined();

      const res = await supertest(app)
        .get(`/api/v1/auth/verify-email?token=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.emailVerified).toBe(true);
      expect(res.body.data.user.accountStatus).toBe('ACTIVE');
    });

    it('should run forgot/reset password successfully', async () => {
      await supertest(app).post('/api/v1/auth/register').send(validUser);

      const forgotRes = await supertest(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: validUser.email });

      expect(forgotRes.status).toBe(200);
      const resetToken = forgotRes.body.data?.resetToken;
      expect(resetToken).toBeDefined();

      const newPassword = 'NewSecretPassword99!';
      const resetRes = await supertest(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: resetToken,
          password: newPassword,
          confirmPassword: newPassword,
        });

      expect(resetRes.status).toBe(200);
      expect(resetRes.body.success).toBe(true);

      const loginRes = await supertest(app)
        .post('/api/v1/auth/login')
        .send({
          email: validUser.email,
          password: newPassword,
        });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.success).toBe(true);
      expect(loginRes.body.data.token).toBeDefined();
    });
  });
});
