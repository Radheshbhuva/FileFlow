import supertest from 'supertest';
import express, { Router } from 'express';
import { z } from 'zod';
import { validate } from '../src/middleware/validation.middleware';
import { errorMiddleware } from '../src/middleware/error.middleware';
import { BadRequestError } from '../src/utils/app-error';

describe('Validation and AppError Handler Tests', () => {
  let testApp: express.Express;

  beforeAll(() => {
    testApp = express();
    testApp.use(express.json());

    const router = Router();

    const testSchema = {
      body: z.object({
        username: z.string().min(3, 'Username must be at least 3 characters'),
        email: z.string().email('Invalid email address format'),
      }),
      query: z.object({
        limit: z.string().transform(Number).refine(n => n > 0 && n <= 100, 'Limit must be 1-100'),
      }),
    };

    router.post('/validate-endpoint', validate(testSchema), (req, res) => {
      res.status(200).json({
        success: true,
        data: { body: req.body, query: req.query },
      });
    });

    router.get('/error-endpoint', (req, res, next) => {
      next(new BadRequestError('Custom bad request occurred', [{ detail: 'Some detail' }]));
    });

    testApp.use('/api', router);
    testApp.use(errorMiddleware);
  });

  it('should return 400 and fields validation detail array when schema checks fail', async () => {
    const response = await supertest(testApp)
      .post('/api/validate-endpoint?limit=250')
      .send({ username: 'xy', email: 'invalid_email' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: 'Validation Failed',
      errors: expect.arrayContaining([
        { field: 'body.username', message: 'Username must be at least 3 characters' },
        { field: 'body.email', message: 'Invalid email address format' },
        { field: 'query.limit', message: 'Limit must be 1-100' },
      ]),
    });
  });

  it('should pass checks and transform parsed parameters (e.g. string to number)', async () => {
    const response = await supertest(testApp)
      .post('/api/validate-endpoint?limit=42')
      .send({ username: 'testing_user', email: 'test@fileflow.com' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.query.limit).toBe(42);
  });

  it('should return correct HTTP codes and error structure for AppErrors', async () => {
    const response = await supertest(testApp).get('/api/error-endpoint');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: 'Custom bad request occurred',
      errors: [{ detail: 'Some detail' }],
    });
  });
});
