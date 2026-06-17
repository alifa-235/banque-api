// src/tests/fixtures/test-data.js
import bcrypt from 'bcryptjs';

export const testUsers = {
  admin: {
    clientName: 'Admin Test',
    clientEmail: 'admin@test.com',
    password: 'admin123',
    type: 'courant',
    role: 'admin',
    balance: 0,
    currency: 'XAF',
    status: 'active'
  },
  client1: {
    clientName: 'Jean Dupont',
    clientEmail: 'jean@test.com',
    password: 'client123',
    type: 'courant',
    role: 'client',
    balance: 100000,
    currency: 'XAF',
    status: 'active'
  },
  client2: {
    clientName: 'Marie Claire',
    clientEmail: 'marie@test.com',
    password: 'client123',
    type: 'epargne',
    role: 'client',
    balance: 50000,
    currency: 'XAF',
    status: 'active'
  },
  inactiveClient: {
    clientName: 'Inactive User',
    clientEmail: 'inactive@test.com',
    password: 'client123',
    type: 'courant',
    role: 'client',
    balance: 1000,
    currency: 'XAF',
    status: 'inactive'
  }
};

export const testTransactions = {
  deposit: {
    amount: 25000,
    description: 'Dépôt test'
  },
  withdraw: {
    amount: 10000,
    description: 'Retrait test'
  },
  transfer: {
    amount: 15000,
    description: 'Virement test'
  }
};

export const createTestUser = async (Account, userData) => {
  const hashedPassword = await bcrypt.hash(userData.password, 10);
  const user = new Account({
    ...userData,
    password: hashedPassword
  });
  await user.save();
  return user;
};

export const getAuthToken = async (app, email, password) => {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ clientEmail: email, password });
  return response.body.data?.token;
};