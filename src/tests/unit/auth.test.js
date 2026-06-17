// src/tests/unit/auth.test.js
import { describe, it, expect, vi, beforeAll } from 'vitest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Account } from '../../models/Account';
import { testUsers, createTestUser } from '../fixtures/test-data';
import { register, login, verifyToken } from '../../controllers/authController';

describe('🔐 Auth - Tests unitaires complets', () => {

  // Mock de la requête et réponse Express
  const mockRequest = (body = {}, headers = {}) => ({
    body,
    headers
  });
  
  const mockResponse = () => {
    const res = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
  };

  describe('Hachage des mots de passe', () => {
    it('✅ devrait créer un hash de mot de passe valide', async () => {
      const password = 'password123';
      const hash = await bcrypt.hash(password, 10);
      
      expect(hash).not.toBe(password);
      expect(hash).toMatch(/^\$2[aby]\$/);
    });

    it('✅ devrait valider un mot de passe correct', async () => {
      const password = 'password123';
      const hash = await bcrypt.hash(password, 10);
      const isValid = await bcrypt.compare(password, hash);
      
      expect(isValid).toBe(true);
    });

    it('❌ devrait rejeter un mot de passe incorrect', async () => {
      const password = 'password123';
      const hash = await bcrypt.hash(password, 10);
      const isValid = await bcrypt.compare('wrongpassword', hash);
      
      expect(isValid).toBe(false);
    });
  });

  describe('JWT Token', () => {
    const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_123';

    it('✅ devrait générer un token valide', () => {
      const payload = { id: '123', email: 'test@test.com', role: 'client' };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });

    it('✅ devrait décoder un token valide', () => {
      const payload = { id: '123', email: 'test@test.com', role: 'client' };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
      
      const decoded = jwt.verify(token, JWT_SECRET);
      expect(decoded.id).toBe(payload.id);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.role).toBe(payload.role);
    });

    it('❌ devrait rejeter un token invalide', () => {
      const invalidToken = 'invalid.token.here';
      
      expect(() => {
        jwt.verify(invalidToken, JWT_SECRET);
      }).toThrow();
    });
  });

  describe('Inscription', () => {
    it('✅ devrait créer un nouveau compte client', async () => {
      const req = mockRequest({
        clientName: 'Register Test',
        clientEmail: 'register@test.com',
        password: 'password123',
        type: 'courant'
      });
      const res = mockResponse();

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Compte client créé avec succès'
        })
      );

      const account = await Account.findOne({ clientEmail: 'register@test.com' });
      expect(account).toBeDefined();
      expect(account.role).toBe('client');
    });

    it('❌ ne devrait pas créer un compte avec un email existant', async () => {
      await createTestUser(Account, testUsers.client1);

      const req = mockRequest({
        clientName: 'Another User',
        clientEmail: testUsers.client1.clientEmail,
        password: 'password123',
        type: 'courant'
      });
      const res = mockResponse();

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Cet email est déjà utilisé'
        })
      );
    });

    it('❌ ne devrait pas créer un compte avec un mot de passe trop court', async () => {
      const req = mockRequest({
        clientName: 'Short Password',
        clientEmail: 'short@test.com',
        password: '12345',
        type: 'courant'
      });
      const res = mockResponse();

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Le mot de passe doit contenir au moins 6 caractères'
        })
      );
    });

    it('❌ ne devrait pas créer un compte avec des champs manquants', async () => {
      const req = mockRequest({
        clientEmail: 'missing@test.com',
        password: 'password123'
      });
      const res = mockResponse();

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Tous les champs sont requis'
        })
      );
    });
  });

  describe('Connexion', () => {
    it('✅ devrait connecter un utilisateur avec des identifiants valides', async () => {
      const hashedPassword = await bcrypt.hash('validpassword', 10);
      await new Account({
        ...testUsers.client1,
        password: hashedPassword
      }).save();

      const req = mockRequest({
        clientEmail: testUsers.client1.clientEmail,
        password: 'validpassword'
      });
      const res = mockResponse();

      await login(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Connexion réussie'
        })
      );
    });

    it('❌ ne devrait pas connecter un utilisateur avec un mot de passe incorrect', async () => {
      const hashedPassword = await bcrypt.hash('correctpassword', 10);
      await new Account({
        ...testUsers.client1,
        password: hashedPassword
      }).save();

      const req = mockRequest({
        clientEmail: testUsers.client1.clientEmail,
        password: 'wrongpassword'
      });
      const res = mockResponse();

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Email ou mot de passe incorrect'
        })
      );
    });

    it('❌ ne devrait pas connecter un utilisateur inexistant', async () => {
      const req = mockRequest({
        clientEmail: 'nonexistent@test.com',
        password: 'password123'
      });
      const res = mockResponse();

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Email ou mot de passe incorrect'
        })
      );
    });

    it('❌ ne devrait pas connecter un compte bloqué', async () => {
      const blockedUser = {
        ...testUsers.client1,
        clientEmail: 'blocked@test.com',
        status: 'blocked'
      };
      await createTestUser(Account, blockedUser);

      const req = mockRequest({
        clientEmail: 'blocked@test.com',
        password: 'client123'
      });
      const res = mockResponse();

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Compte bloqué. Contactez l\'administrateur.'
        })
      );
    });
  });

  describe('Vérification de token', () => {
    it('✅ devrait vérifier un token valide', async () => {
      const account = await createTestUser(Account, testUsers.client1);
      const token = jwt.sign(
        { id: account.id, email: account.clientEmail, role: account.role },
        process.env.JWT_SECRET || 'super_secret_key_123',
        { expiresIn: '1h' }
      );

      const req = mockRequest({}, { authorization: `Bearer ${token}` });
      const res = mockResponse();

      await verifyToken(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            user: expect.objectContaining({
              id: account.id,
              email: account.clientEmail
            })
          })
        })
      );
    });

    it('❌ devrait rejeter un token manquant', async () => {
      const req = mockRequest({}, {});
      const res = mockResponse();

      await verifyToken(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Token manquant'
        })
      );
    });

    it('❌ devrait rejeter un token invalide', async () => {
      const req = mockRequest({}, { authorization: 'Bearer invalid.token.here' });
      const res = mockResponse();

      await verifyToken(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Token invalide'
        })
      );
    });
  });
});