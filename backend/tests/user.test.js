import request from 'supertest';
import express from 'express';
import userRoutes from '../routes/users.js';
import errorHandler from '../middleware/errorHandler.js';
import { createPool } from '../db.js';

// Create a new pool instance for tests
const testPool = createPool();

// Create a new app instance for tests
const app = express();
app.use(express.json());
app.use('/api', userRoutes);
app.use(errorHandler);

describe('User Registration and Login', () => {
  let testEmail = `jestuser${Date.now()}@example.com`;
  let testPassword = 'jestpassword';
  let registeredUser = null;

  // Clean up before all tests
  beforeAll(async () => {
    await testPool.query('DELETE FROM users WHERE email LIKE $1', ['jestuser%@example.com']);
  });

  // Clean up after all tests
  afterAll(async () => {
    try {
      await testPool.query('DELETE FROM users WHERE email LIKE $1', ['jestuser%@example.com']);
      await testPool.end();
    } catch (error) {
      console.error('Error cleaning up test database:', error);
    }
  });

  // Test registration first
  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({
        name: 'Jest User',
        email: testEmail,
        password: testPassword
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(testEmail);
    registeredUser = res.body.data;
  });

  // Then test successful login
  it('should login with the new user', async () => {
    expect(registeredUser).not.toBeNull(); // Ensure user was registered
    const res = await request(app)
      .post('/api/users/login')
      .send({
        email: testEmail,
        password: testPassword
      });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(testEmail);
  });

  // Finally test failed login
  it('should fail login with wrong password', async () => {
    expect(registeredUser).not.toBeNull(); // Ensure user was registered
    const res = await request(app)
      .post('/api/users/login')
      .send({
        email: testEmail,
        password: 'wrongpassword'
      });
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toBe('Invalid password');
  });
});