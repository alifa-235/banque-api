// src/tests/unit/account.test.js
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { Account } from '../../models/Account';
import { testUsers, createTestUser } from '../fixtures/test-data';

describe('📋 Modèle Account - Tests unitaires complets', () => {

  describe('Création de compte', () => {
    it('✅ devrait créer un compte avec tous les champs requis', async () => {
      const accountData = {
        clientName: 'Test Complet',
        clientEmail: 'complet@test.com',
        password: await bcrypt.hash('password123', 10),
        type: 'courant',
        role: 'client',
        balance: 1000,
        currency: 'XAF',
        status: 'active'
      };

      const account = new Account(accountData);
      await account.save();

      expect(account).toHaveProperty('_id');
      expect(account.clientName).toBe('Test Complet');
      expect(account.clientEmail).toBe('complet@test.com');
      expect(account.balance).toBe(1000);
      expect(account.accountNumber).toBeDefined();
      expect(account.accountNumber).toMatch(/^FR76/);
    });

    it('✅ devrait générer automatiquement un numéro de compte unique', async () => {
      const account1 = new Account({
        clientName: 'Unique Test 1',
        clientEmail: 'unique1@test.com',
        password: await bcrypt.hash('password123', 10),
        type: 'courant'
      });
      await account1.save();

      const account2 = new Account({
        clientName: 'Unique Test 2',
        clientEmail: 'unique2@test.com',
        password: await bcrypt.hash('password123', 10),
        type: 'courant'
      });
      await account2.save();

      expect(account1.accountNumber).not.toBe(account2.accountNumber);
    });

    it('❌ ne devrait pas créer deux comptes avec le même email', async () => {
      const accountData = {
        clientName: 'Duplicate Test',
        clientEmail: 'duplicate@test.com',
        password: await bcrypt.hash('password123', 10),
        type: 'courant'
      };

      await new Account(accountData).save();
      await expect(new Account(accountData).save()).rejects.toThrow();
    });

    it('✅ devrait avoir un solde par défaut à 0 si non spécifié', async () => {
      const account = new Account({
        clientName: 'Zero Balance',
        clientEmail: 'zero@test.com',
        password: await bcrypt.hash('password123', 10),
        type: 'courant'
      });

      await account.save();
      expect(account.balance).toBe(0);
    });
  });

  describe('Mise à jour de compte', () => {
    it('✅ devrait mettre à jour le solde d\'un compte', async () => {
      const account = await createTestUser(Account, testUsers.client1);
      const initialBalance = account.balance;

      account.balance += 50000;
      await account.save();

      expect(account.balance).toBe(initialBalance + 50000);
    });

    it('✅ devrait mettre à jour le statut d\'un compte', async () => {
      const account = await createTestUser(Account, testUsers.client1);
      expect(account.status).toBe('active');

      account.status = 'inactive';
      await account.save();

      expect(account.status).toBe('inactive');
    });

    it('✅ devrait mettre à jour les informations du client', async () => {
      const account = await createTestUser(Account, testUsers.client1);
      
      account.clientName = 'Nouveau Nom';
      account.clientEmail = 'nouveau@test.com';
      await account.save();

      expect(account.clientName).toBe('Nouveau Nom');
      expect(account.clientEmail).toBe('nouveau@test.com');
    });
  });

  describe('Validation des données', () => {
    it('❌ ne devrait pas accepter un solde négatif', async () => {
      const account = new Account({
        clientName: 'Negative Balance',
        clientEmail: 'negative@test.com',
        password: await bcrypt.hash('password123', 10),
        type: 'courant',
        balance: -100
      });

      await expect(account.save()).rejects.toThrow();
    });

    it('❌ ne devrait pas accepter un email invalide', async () => {
      const account = new Account({
        clientName: 'Invalid Email',
        clientEmail: 'invalid-email',
        password: await bcrypt.hash('password123', 10),
        type: 'courant'
      });

      // Note: Si vous n'avez pas de validation email dans le schéma, ce test peut échouer
      // Vous pouvez ajouter une validation ou adapter le test
      await expect(account.save()).rejects.toThrow();
    });

    it('✅ devrait accepter un type de compte valide (courant ou epargne)', async () => {
      const courant = new Account({
        clientName: 'Courant Test',
        clientEmail: 'courant@test.com',
        password: await bcrypt.hash('password123', 10),
        type: 'courant'
      });
      await courant.save();
      expect(courant.type).toBe('courant');

      const epargne = new Account({
        clientName: 'Epargne Test',
        clientEmail: 'epargne@test.com',
        password: await bcrypt.hash('password123', 10),
        type: 'epargne'
      });
      await epargne.save();
      expect(epargne.type).toBe('epargne');
    });
  });

  describe('Recherche de comptes', () => {
    it('✅ devrait trouver un compte par email', async () => {
      await createTestUser(Account, testUsers.client1);
      
      const found = await Account.findOne({ clientEmail: testUsers.client1.clientEmail });
      expect(found).toBeDefined();
      expect(found.clientName).toBe(testUsers.client1.clientName);
    });

    it('✅ devrait trouver un compte par accountNumber', async () => {
      const account = await createTestUser(Account, testUsers.client1);
      
      const found = await Account.findOne({ accountNumber: account.accountNumber });
      expect(found).toBeDefined();
      expect(found.id).toBe(account.id);
    });

    it('✅ devrait lister les comptes actifs', async () => {
      await createTestUser(Account, testUsers.client1);
      await createTestUser(Account, testUsers.inactiveClient);
      
      const activeAccounts = await Account.find({ status: 'active' });
      expect(activeAccounts.length).toBeGreaterThan(0);
      activeAccounts.forEach(acc => {
        expect(acc.status).toBe('active');
      });
    });
  });
});