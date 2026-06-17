// src/tests/integration/account-api.test.js
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app';
import { Account } from '../../models/Account';
import { testUsers, createTestUser } from '../fixtures/test-data';

describe('🏦 API Comptes - Tests d\'intégration complets', () => {
  
  let adminToken;
  let adminId;
  let clientToken;
  let clientId;
  let client2Token;
  let client2Id;

  beforeAll(async () => {
    // Créer admin
    const adminReg = await request(app)
      .post('/api/auth/register')
      .send({
        clientName: 'Admin API Test',
        clientEmail: 'adminapi@test.com',
        password: 'admin123',
        type: 'courant',
        role: 'admin'
      });
    adminToken = adminReg.body.data.token;
    adminId = adminReg.body.data.user.id;

    // Créer client 1
    const clientReg = await request(app)
      .post('/api/auth/register')
      .send({
        clientName: 'Client API Test 1',
        clientEmail: 'client1api@test.com',
        password: 'client123',
        type: 'courant'
      });
    clientToken = clientReg.body.data.token;
    clientId = clientReg.body.data.user.id;

    // Créer client 2
    const client2Reg = await request(app)
      .post('/api/auth/register')
      .send({
        clientName: 'Client API Test 2',
        clientEmail: 'client2api@test.com',
        password: 'client123',
        type: 'epargne'
      });
    client2Token = client2Reg.body.data.token;
    client2Id = client2Reg.body.data.user.id;

    // Ajouter un solde initial au client 1
    await request(app)
      .post('/api/client/deposit')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        accountId: clientId,
        amount: 100000,
        description: 'Dépôt initial pour tests'
      });
  });

  describe('POST /api/admin/accounts', () => {
    it('✅ devrait créer un compte avec un admin', async () => {
      const response = await request(app)
        .post('/api/admin/accounts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          clientName: 'Admin Created Account',
          clientEmail: 'admincreated@test.com',
          password: 'password123',
          type: 'courant',
          role: 'client',
          initialDeposit: 50000
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.balance).toBe(50000);
      expect(response.body.data.accountNumber).toBeDefined();

      // Vérifier la transaction créée
      const account = await Account.findOne({ clientEmail: 'admincreated@test.com' });
      expect(account).toBeDefined();
    });

    it('❌ ne devrait pas créer un compte sans token admin', async () => {
      const response = await request(app)
        .post('/api/admin/accounts')
        .send({
          clientName: 'Unauthorized',
          clientEmail: 'unauth@test.com',
          password: 'password123',
          type: 'courant'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Accès non autorisé - Token manquant');
    });

    it('❌ ne devrait pas créer un compte avec un token client', async () => {
      const response = await request(app)
        .post('/api/admin/accounts')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          clientName: 'Client Trying Admin',
          clientEmail: 'clientadmin@test.com',
          password: 'password123',
          type: 'courant'
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Accès refusé - Droits administrateur requis');
    });

    it('❌ ne devrait pas créer un compte avec un email existant', async () => {
      const response = await request(app)
        .post('/api/admin/accounts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          clientName: 'Duplicate Email',
          clientEmail: 'client1api@test.com', // Email déjà utilisé
          password: 'password123',
          type: 'courant'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Cet email est déjà utilisé');
    });
  });

  describe('GET /api/admin/accounts', () => {
    it('✅ devrait lister tous les comptes pour un admin', async () => {
      const response = await request(app)
        .get('/api/admin/accounts')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
      expect(response.body.pagination).toBeDefined();
    });

    it('✅ devrait filtrer les comptes par type', async () => {
      const response = await request(app)
        .get('/api/admin/accounts?type=epargne')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      response.body.data.forEach(acc => {
        expect(acc.type).toBe('epargne');
      });
    });

    it('✅ devrait filtrer les comptes par statut', async () => {
      const response = await request(app)
        .get('/api/admin/accounts?status=active')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      response.body.data.forEach(acc => {
        expect(acc.status).toBe('active');
      });
    });

    it('❌ ne devrait pas permettre à un client de lister les comptes', async () => {
      const response = await request(app)
        .get('/api/admin/accounts')
        .set('Authorization', `Bearer ${clientToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Accès refusé - Droits administrateur requis');
    });
  });

  describe('GET /api/admin/accounts/:id', () => {
    it('✅ devrait obtenir les détails d\'un compte spécifique', async () => {
      const response = await request(app)
        .get(`/api/admin/accounts/${clientId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('clientName');
      expect(response.body.data).toHaveProperty('accountNumber');
      expect(response.body.data).toHaveProperty('transactions');
    });

    it('❌ devrait retourner une erreur pour un compte inexistant', async () => {
      const response = await request(app)
        .get('/api/admin/accounts/123456789012345678901234')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Compte non trouvé');
    });
  });

  describe('POST /api/client/deposit', () => {
    it('✅ devrait permettre à un client de faire un dépôt sur son compte', async () => {
      const depositAmount = 25000;
      const response = await request(app)
        .post('/api/client/deposit')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          accountId: clientId,
          amount: depositAmount,
          description: 'Dépôt test'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.newBalance).toBe(125000);

      // Vérifier que la transaction est créée
      const account = await Account.findById(clientId);
      expect(account.balance).toBe(125000);
    });

    it('❌ ne devrait pas accepter un montant négatif', async () => {
      const response = await request(app)
        .post('/api/client/deposit')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          accountId: clientId,
          amount: -1000,
          description: 'Montant négatif'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Montant invalide');
    });

    it('❌ ne devrait pas accepter un dépôt sur un compte inactif', async () => {
      // Créer un compte inactif
      const inactiveReg = await request(app)
        .post('/api/auth/register')
        .send({
          clientName: 'Inactive Deposit',
          clientEmail: 'inactivedeposit@test.com',
          password: 'password123',
          type: 'courant'
        });

      const inactiveToken = inactiveReg.body.data.token;
      const inactiveId = inactiveReg.body.data.user.id;

      // Désactiver le compte
      await Account.findByIdAndUpdate(inactiveId, { status: 'inactive' });

      const response = await request(app)
        .post('/api/client/deposit')
        .set('Authorization', `Bearer ${inactiveToken}`)
        .send({
          accountId: inactiveId,
          amount: 1000,
          description: 'Dépôt sur compte inactif'
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Compte inactif');
    });
  });

  describe('POST /api/client/withdraw', () => {
    it('✅ devrait permettre à un client de faire un retrait sur son compte', async () => {
      const withdrawAmount = 10000;
      const response = await request(app)
        .post('/api/client/withdraw')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          accountId: clientId,
          amount: withdrawAmount,
          description: 'Retrait test'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.newBalance).toBe(115000);

      const account = await Account.findById(clientId);
      expect(account.balance).toBe(115000);
    });

    it('❌ ne devrait pas accepter un retrait avec un solde insuffisant', async () => {
      const response = await request(app)
        .post('/api/client/withdraw')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          accountId: clientId,
          amount: 999999,
          description: 'Retrait trop important'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Solde insuffisant');
    });

    it('❌ ne devrait pas accepter un montant négatif', async () => {
      const response = await request(app)
        .post('/api/client/withdraw')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          accountId: clientId,
          amount: -1000,
          description: 'Montant négatif'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Montant invalide');
    });
  });

  describe('POST /api/client/transfer', () => {
    it('✅ devrait permettre un virement entre comptes clients', async () => {
      const transferAmount = 15000;
      const response = await request(app)
        .post('/api/client/transfer')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          fromAccountId: clientId,
          toAccountId: client2Id,
          amount: transferAmount,
          description: 'Virement test'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.fromAccountBalance).toBe(100000); // 115000 - 15000
      expect(response.body.data.toAccountBalance).toBe(15000);

      // Vérifier que les transactions sont créées
      const fromAccount = await Account.findById(clientId);
      const toAccount = await Account.findById(client2Id);
      expect(fromAccount.balance).toBe(100000);
      expect(toAccount.balance).toBe(15000);
    });

    it('❌ ne devrait pas permettre un virement vers le même compte', async () => {
      const response = await request(app)
        .post('/api/client/transfer')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          fromAccountId: clientId,
          toAccountId: clientId,
          amount: 1000,
          description: 'Virement vers soi-même'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Impossible de faire un virement vers le même compte');
    });

    it('❌ ne devrait pas permettre un virement avec un solde insuffisant', async () => {
      const response = await request(app)
        .post('/api/client/transfer')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          fromAccountId: clientId,
          toAccountId: client2Id,
          amount: 999999,
          description: 'Virement trop important'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Solde insuffisant sur le compte source');
    });

    it('❌ ne devrait pas permettre un virement vers un compte inactif', async () => {
      // Créer un compte inactif
      const inactiveReg = await request(app)
        .post('/api/auth/register')
        .send({
          clientName: 'Inactive Receiver',
          clientEmail: 'inactivereceiver@test.com',
          password: 'password123',
          type: 'courant'
        });

      const inactiveId = inactiveReg.body.data.user.id;
      await Account.findByIdAndUpdate(inactiveId, { status: 'inactive' });

      const response = await request(app)
        .post('/api/client/transfer')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          fromAccountId: clientId,
          toAccountId: inactiveId,
          amount: 1000,
          description: 'Virement vers compte inactif'
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Un des comptes est inactif');
    });
  });

  describe('GET /api/client/transactions', () => {
    it('✅ devrait retourner l\'historique des transactions du client', async () => {
      const response = await request(app)
        .get('/api/client/transactions?limit=10')
        .set('Authorization', `Bearer ${clientToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThanOrEqual(4);
      expect(response.body.total).toBeGreaterThanOrEqual(4);
    });

    it('✅ devrait filtrer les transactions par type', async () => {
      const response = await request(app)
        .get('/api/client/transactions?type=depot')
        .set('Authorization', `Bearer ${clientToken}`);

      expect(response.status).toBe(200);
      response.body.data.forEach(t => {
        expect(t.type).toBe('depot');
      });
    });

    it('✅ devrait respecter la limite', async () => {
      const response = await request(app)
        .get('/api/client/transactions?limit=2')
        .set('Authorization', `Bearer ${clientToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeLessThanOrEqual(2);
    });
  });

  describe('PUT /api/admin/accounts/:id', () => {
    it('✅ devrait permettre à un admin de mettre à jour un compte', async () => {
      const response = await request(app)
        .put(`/api/admin/accounts/${clientId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          clientName: 'Updated Name',
          clientEmail: 'updated@test.com',
          type: 'epargne',
          status: 'inactive'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.clientName).toBe('Updated Name');
      expect(response.body.data.clientEmail).toBe('updated@test.com');
      expect(response.body.data.type).toBe('epargne');
      expect(response.body.data.status).toBe('inactive');
    });

    it('❌ ne devrait pas permettre à un client de modifier un compte', async () => {
      const response = await request(app)
        .put(`/api/admin/accounts/${clientId}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          clientName: 'Hacked Name'
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Accès refusé - Droits administrateur requis');
    });
  });

  describe('DELETE /api/admin/accounts/:id', () => {
    it('✅ devrait permettre à un admin de supprimer un compte', async () => {
      // Créer un compte à supprimer
      const deleteReg = await request(app)
        .post('/api/auth/register')
        .send({
          clientName: 'To Delete',
          clientEmail: 'todelete@test.com',
          password: 'password123',
          type: 'courant'
        });

      const deleteId = deleteReg.body.data.user.id;

      const response = await request(app)
        .delete(`/api/admin/accounts/${deleteId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const deleted = await Account.findById(deleteId);
      expect(deleted).toBeNull();
    });

    it('❌ ne devrait pas permettre à un client de supprimer un compte', async () => {
      const response = await request(app)
        .delete(`/api/admin/accounts/${clientId}`)
        .set('Authorization', `Bearer ${clientToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Accès refusé - Droits administrateur requis');
    });
  });

  describe('GET /api/find-account', () => {
    it('✅ devrait trouver un compte par email', async () => {
      const response = await request(app)
        .get(`/api/find-account?email=${encodeURIComponent('client1api@test.com')}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.clientEmail).toBe('client1api@test.com');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('accountNumber');
    });

    it('❌ devrait retourner une erreur pour un email inexistant', async () => {
      const response = await request(app)
        .get('/api/find-account?email=inexistant@test.com');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Compte non trouvé');
    });

    it('❌ devrait retourner une erreur sans email', async () => {
      const response = await request(app)
        .get('/api/find-account');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email requis');
    });
  });
});