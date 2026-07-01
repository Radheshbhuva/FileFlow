import supertest from 'supertest';
import { app } from '../src/app';

describe('GET /health', () => {
  it('should return 200 and healthy status payload', async () => {
    const response = await supertest(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: 'healthy',
      service: 'fileflow-backend',
      version: 'v1',
    });
  });

  it('should also return 200 at versioned /api/v1/health path', async () => {
    const response = await supertest(app).get('/api/v1/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: 'healthy',
      service: 'fileflow-backend',
      version: 'v1',
    });
  });
});
