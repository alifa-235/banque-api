// src/tests/integration/auth-api.test.js
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app';
import { Account } from '../../models/Account';
import { testUsers, createTestUser } from '../fixtures/test-data';

describe('🔐 API Auth - Tests d\'intégration complets', () => {

  describe('POST /api/auth/register', () => {
    it('✅ devrait créer un nouveau compte client', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          clientName: 'Integration Test',
          clientEmail: 'integration@test.com',
          password: 'password123',
          type: 'courant'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user.role).toBe('client');
      expect(response.body.data.user).toHaveProperty('accountNumber');

      // Vérifier en base
      const account = await Account.findOne({ clientEmail: 'integration@test.com' });
      expect(account).toBeDefined();
      expect(account.balance).toBe(0);
    });

    it('✅ devrait créer un compte admin si spécifié (avec token admin)', async () => {
      // D'abord créer un admin
      const adminReg = await request(app)
        .post('/api/auth/register')
        .send({
          clientName: 'Admin Creator',
          clientEmail: 'admincreator@test.com',
          password: 'admin123',
          type: 'courant',
          role: 'admin'
        });

      const adminToken = adminReg.body.data.token;

      // Créer un autre admin avec le token
      const response = await request(app)
        .post('/api/admin/accounts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          clientName: 'New Admin',
          clientEmail: 'newadmin@test.com',
          password: 'admin123',
          type: 'courant',
          role: 'admin'
        });

      expect(response.status).toBe(201);
      expect(response.body.data.role).toBe('admin');
    });

    it('❌ devrait retourner une erreur si l\'email existe déjà', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          clientName: 'First User',
          clientEmail: 'first@test.com',
          password: 'password123',
          type: 'courant'
        });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          clientName: 'Second User',
          clientEmail: 'first@test.com',
          password: 'password123',
          type: 'courant'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Cet email est déjà utilisé');
    });

    it('❌ devrait retourner une erreur si le mot de passe est trop court', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          clientName: 'Short Pass',
          clientEmail: 'short@test.com',
          password: '12345',
          type: 'courant'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Le mot de passe doit contenir au moins 6 caractères');
    });

    it('❌ devrait retourner une erreur si des champs sont manquants', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          clientEmail: 'missing@test.com',
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Tous les champs sont requis');
    });
  });

  describe('POST /api/auth/login', () => {
    it('✅ devrait connecter un utilisateur avec des identifiants valides', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          clientName: 'Login Test',
          clientEmail: 'logintest@test.com',
          password: 'validpassword',
          type: 'courant'
        });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          clientEmail: 'logintest@test.com',
          password: 'validpassword'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user).toHaveProperty('id');
      expect(response.body.data.user).toHaveProperty('accountNumber');
      expect(response.body.data.user.role).toBe('client');
    });

    it('✅ devrait connecter un admin avec des identifiants valides', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          clientName: 'Admin Login',
          clientEmail: 'adminlogin@test.com',
          password: 'admin123',
          type: 'courant',
          role: 'admin'
        });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          clientEmail: 'adminlogin@test.com',
          password: 'admin123'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.user.role).toBe('admin');
    });

    it('❌ devrait retourner une erreur avec un mot de passe incorrect', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          clientName: 'Wrong Test',
          clientEmail: 'wrong@test.com',
          password: 'correctpassword',
          type: 'courant'
        });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          clientEmail: 'wrong@test.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Email ou mot de passe incorrect');
    });

    it('❌ devrait retourner une erreur si l\'email n\'existe pas', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          clientEmail: 'nonexistent@test.com',
          password: 'password123'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Email ou mot de passe incorrect');
    });

    it('❌ ne devrait pas connecter un compte bloqué', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          clientName: 'Blocked User',
          clientEmail: 'blocked@test.com',
          password: 'password123',
          type: 'courant'
        });

      // Bloquer le compte manuellement
      await Account.findOneAndUpdate(
        { clientEmail: 'blocked@test.com' },
        { status: 'blocked' }
      );

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          clientEmail: 'blocked@test.com',
          password: 'password123'
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Compte bloqué. Contactez l\'administrateur.');
    });
  });

  describe('GET /api/auth/verify', () => {
    let validToken;
    let userId;

    beforeAll(async () => {
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          clientName: 'Verify Test',
          clientEmail: 'verify@test.com',
          password: 'password123',
          type: 'courant'
        });
      validToken = registerResponse.body.data.token;
      userId = registerResponse.body.data.user.id;
    });

    it('✅ devrait vérifier un token valide', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('verify@test.com');
    });

    it('❌ devrait retourner une erreur avec un token invalide', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', 'Bearer invalidtoken123');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Token invalide');
    });

    it('❌ devrait retourner une erreur sans token', async () => {
      const response = await request(app)
        .get('/api/auth/verify');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Token manquant');
    });

    it('✅ devrait retourner les informations du compte', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.body.data.user).toHaveProperty('id', userId);
      expect(response.body.data.user).toHaveProperty('accountNumber');
      expect(response.body.data.user).toHaveProperty('balance');
      expect(response.body.data.user).toHaveProperty('type');
      expect(response.body.data.user).toHaveProperty('status');
    });
  });
});