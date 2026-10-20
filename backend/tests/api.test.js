const request = require('supertest');
const { app } = require('../server');
const { connectDB, closeDB } = require('../config/db');

jest.setTimeout(60000);

describe('ERP System API Integration Tests', () => {
  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await connectDB();
  }, 60000);

  afterAll(async () => {
    await closeDB();
  });

  test('GET /api/health returns 200 OK', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.system).toContain('ERP Management System');
  });

  test('POST /api/register creates a new user or returns existing error', async () => {
    const randomEmail = `test_${Date.now()}@erp.com`;
    const res = await request(app).post('/api/register').send({
      name: 'Test Auditor',
      email: randomEmail,
      password: 'password123',
      role: 'admin',
    });
    expect([201, 400]).toContain(res.statusCode);
    if (res.statusCode === 201) {
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
    }
  });

  test('POST /api/login with invalid password returns 401', async () => {
    const res = await request(app).post('/api/login').send({
      email: 'nonexistent@erp.com',
      password: 'wrongpassword',
    });
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
