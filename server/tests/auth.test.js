import { describe, it, expect } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import createApp from '../app.js';
import User from '../models/User.js';

const app = createApp();

const validUser = {
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  password: 'password123',
};

describe('POST /api/v1/auth/register', () => {
  it('creates a user and returns a usable JWT', async () => {
    const res = await request(app).post('/api/v1/auth/register').send(validUser);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ name: validUser.name, email: validUser.email });
    expect(res.body.token).toBeTruthy();

    // The token must actually identify the persisted user.
    const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET);
    expect(decoded.id).toBe(res.body._id);

    const stored = await User.findById(res.body._id).select('+password');
    expect(stored).not.toBeNull();
    expect(stored.email).toBe(validUser.email);
  });

  it('never returns or stores the password in plain text', async () => {
    const res = await request(app).post('/api/v1/auth/register').send(validUser);

    expect(res.body.password).toBeUndefined();

    const stored = await User.findById(res.body._id).select('+password');
    expect(stored.password).not.toBe(validUser.password);
    expect(stored.password.startsWith('$2')).toBe(true); // bcrypt hash
  });

  it('rejects a duplicate email with 409', async () => {
    await request(app).post('/api/v1/auth/register').send(validUser);
    const res = await request(app).post('/api/v1/auth/register').send(validUser);

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/already exists/i);
    expect(await User.countDocuments()).toBe(1);
  });

  it('rejects a password shorter than 6 characters', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...validUser, password: 'abc' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/at least 6 characters/i);
    expect(await User.countDocuments()).toBe(0);
  });

  it('rejects a malformed email instead of failing later', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...validUser, email: 'not-an-email' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/valid email/i);
    expect(await User.countDocuments()).toBe(0);
  });

  it('rejects missing fields', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({ email: 'a@b.com' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBeTruthy();
    expect(await User.countDocuments()).toBe(0);
  });

  it('preserves dots in Gmail-style addresses', async () => {
    // normalizeEmail() would rewrite this to adalovelace@gmail.com and change
    // the identity the user signed up with.
    const email = 'ada.lovelace@gmail.com';
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...validUser, email });

    expect(res.status).toBe(201);
    expect(res.body.email).toBe(email);
  });
});

describe('POST /api/v1/auth/login', () => {
  it('logs in with correct credentials', async () => {
    await request(app).post('/api/v1/auth/register').send(validUser);

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: validUser.email, password: validUser.password });

    expect(res.status).toBe(200);
    expect(res.body.email).toBe(validUser.email);
    expect(res.body.token).toBeTruthy();
  });

  it('is case-insensitive on email', async () => {
    await request(app).post('/api/v1/auth/register').send(validUser);

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'ADA@EXAMPLE.COM', password: validUser.password });

    expect(res.status).toBe(200);
  });

  it('rejects a wrong password with 401 and no token', async () => {
    await request(app).post('/api/v1/auth/register').send(validUser);

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: validUser.email, password: 'wrong-password' });

    expect(res.status).toBe(401);
    expect(res.body.token).toBeUndefined();
    expect(res.body.message).toMatch(/invalid email or password/i);
  });

  it('gives the same message for an unknown user as for a wrong password', async () => {
    // Identical responses avoid leaking which emails are registered.
    await request(app).post('/api/v1/auth/register').send(validUser);

    const wrongPassword = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: validUser.email, password: 'wrong-password' });
    const unknownUser = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nobody@example.com', password: 'password123' });

    expect(unknownUser.status).toBe(wrongPassword.status);
    expect(unknownUser.body.message).toBe(wrongPassword.body.message);
  });

  it('rejects missing credentials with 400', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ email: validUser.email });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/required/i);
  });
});

describe('GET /api/v1/auth/me', () => {
  it('returns the authenticated user', async () => {
    const registered = await request(app).post('/api/v1/auth/register').send(validUser);

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${registered.body.token}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ _id: registered.body._id, email: validUser.email });
    expect(res.body.password).toBeUndefined();
  });

  it('rejects a request with no token', async () => {
    const res = await request(app).get('/api/v1/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/no token/i);
  });

  it('rejects a token signed with the wrong secret', async () => {
    const forged = jwt.sign({ id: '507f1f77bcf86cd799439011' }, 'attacker-secret');

    const res = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${forged}`);

    expect(res.status).toBe(401);
  });

  it('rejects a valid token whose user no longer exists', async () => {
    const registered = await request(app).post('/api/v1/auth/register').send(validUser);
    await User.findByIdAndDelete(registered.body._id);

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${registered.body.token}`);

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/user not found/i);
  });
});
