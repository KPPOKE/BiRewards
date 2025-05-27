import request from 'supertest';
import app from '../server.js';
import { pool } from '../db/index.js';

describe('API Key Endpoints', () => {
  let apiKeyId;

  beforeAll(async () => {
    // Setup: Create a test user with admin role
    await pool.query('INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)', ['Admin User', 'admin@test.com', 'password', 'admin']);
  });

  afterAll(async () => {
    // Cleanup: Remove test data
    await pool.query('DELETE FROM api_keys');
    await pool.query('DELETE FROM users WHERE email = $1', ['admin@test.com']);
    await pool.end();
  });

  it('should create a new API key', async () => {
    const res = await request(app)
      .post('/api/api-keys')
      .send({ name: 'Test API Key', permissions: ['read', 'write'] });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('key');
    apiKeyId = res.body.data.id;
  });

  it('should rotate an API key', async () => {
    const res = await request(app)
      .put(`/api/api-keys/${apiKeyId}/rotate`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('key');
  });

  it('should set API key permissions', async () => {
    const res = await request(app)
      .put(`/api/api-keys/${apiKeyId}/permissions`)
      .send({ permissions: ['read'] });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.permissions).toEqual(['read']);
  });
}); 