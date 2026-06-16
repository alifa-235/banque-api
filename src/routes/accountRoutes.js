// src/routes/accountRoutes.js
const express = require('express');
const router = express.Router();

const {
  createAccount,
  getAllAccounts,
  getAccountById,
  updateAccount,
  deleteAccount,  // ← Ajoutez cette ligne
  deposit,
  withdraw,
  transfer,
  getTransactionHistory,
  getMyAccount,
  getMyTransactions
} = require('../controllers/accountController');

const { register, login, verifyToken } = require('../controllers/authController');
const { authenticate, isAdmin, isClient } = require('../middleware/auth');

// ==========================
// ROUTES PUBLIQUES (Authentification)
// ==========================
router.post('/auth/register', register);
router.post('/auth/login', login);
router.get('/auth/verify', verifyToken);

// ==========================
// ROUTES ADMIN (nécessite auth + admin)
// ==========================
router.post('/admin/accounts', authenticate, isAdmin, createAccount);
router.get('/admin/accounts', authenticate, isAdmin, getAllAccounts);
router.get('/admin/accounts/:id', authenticate, isAdmin, getAccountById);
router.put('/admin/accounts/:id', authenticate, isAdmin, updateAccount);
router.delete('/admin/accounts/:id', authenticate, isAdmin, deleteAccount); // ← Utilise deleteAccount
router.post('/admin/deposit', authenticate, isAdmin, deposit);
router.post('/admin/withdraw', authenticate, isAdmin, withdraw);
router.post('/admin/transfer', authenticate, isAdmin, transfer);
router.get('/admin/accounts/:accountId/history', authenticate, isAdmin, getTransactionHistory);

// ==========================
// ROUTES CLIENT (nécessite auth + client)
// ==========================
router.get('/client/me', authenticate, isClient, getMyAccount);
router.get('/client/transactions', authenticate, isClient, getMyTransactions);
router.post('/client/deposit', authenticate, isClient, deposit);
router.post('/client/withdraw', authenticate, isClient, withdraw);
router.post('/client/transfer', authenticate, isClient, transfer);

module.exports = router;