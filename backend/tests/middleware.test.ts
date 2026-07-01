import supertest from 'supertest';
import { app } from '../src/app';

describe('Global Middleware Configuration Tests', () => {
  it('should inject x-request-id header in responses', async () => {
    const response = await supertest(app).get('/health');
    expect(response.headers['x-request-id']).toBeDefined();
    expect(response.headers['x-request-id']).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it('should propagate client-passed x-request-id headers back', async () => {
    const trackingId = 'client-test-tracking-id';
    const response = await supertest(app)
      .get('/health')
      .set('x-request-id', trackingId);
    expect(response.headers['x-request-id']).toBe(trackingId);
  });

  it('should handle unmapped routes with a standard 404 NotFound error format', async () => {
    const response = await supertest(app).get('/api/v1/unmapped-endpoint');
    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      message: 'Route GET /api/v1/unmapped-endpoint not found',
      errors: expect.any(Array),
    });
  });
});
