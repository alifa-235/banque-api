// src/routes/accountRoutes.js
const express = require('express');
const router = express.Router();
const Account = require('../models/Account');  // ← AJOUTER CETTE LIGNE

const {
  createAccount,
  getAllAccounts,
  getAccountById,
  updateAccount,
  deleteAccount,
  deposit,
  withdraw,
  transfer,
  getTransactionHistory,
  getMyAccount,
  getMyTransactions,
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
router.delete('/admin/accounts/:id', authenticate, isAdmin, deleteAccount);
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

// ==========================
// ROUTE PUBLIQUE - Rechercher un compte par email
// ==========================
const findAccountByEmail = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: 'Email requis' });
    }

    // ✅ RECHERCHE INSENSIBLE À LA CASSE
    const account = await Account.findOne({ 
      clientEmail: { $regex: new RegExp(`^${email.trim()}$`, 'i') } 
    }).select('clientName clientEmail accountNumber status');

    if (!account) {
      return res.status(404).json({ error: 'Compte non trouvé' });
    }

    res.json({
      success: true,
      data: {
        id: account._id,
        clientName: account.clientName,
        clientEmail: account.clientEmail,
        accountNumber: account.accountNumber,
        status: account.status
      }
    });
  } catch (error) {
    console.error('Erreur recherche:', error);
    res.status(500).json({ error: 'Erreur lors de la recherche' });
  }
};

router.get('/find-account', findAccountByEmail);

module.exports = router;