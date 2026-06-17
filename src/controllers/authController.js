// src/controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Account = require('../models/Account');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_123';

// ==========================
// INSCRIPTION (créé un client)
// ==========================
const register = async (req, res) => {
  try {
    const { clientName, clientEmail, password, type = 'courant' } = req.body;

    if (!clientName || !clientEmail || !password) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères' });
    }

    const existingAccount = await Account.findOne({ clientEmail });
    if (existingAccount) {
      return res.status(400).json({ error: 'Cet email est déjà utilisé' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ FORCER le rôle 'client' pour toutes les inscriptions
    const account = new Account({
      clientName,
      clientEmail,
      password: hashedPassword,
      type,
      role: 'client',
      balance: 0,
      currency: 'XAF',
      status: 'active'
    });

    await account.save();

    const token = jwt.sign(
      { id: account._id, email: account.clientEmail, role: account.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      message: 'Compte client créé avec succès',
      data: {
        token,
        user: {
          id: account._id,
          name: account.clientName,
          email: account.clientEmail,
          role: account.role,
          accountNumber: account.accountNumber
        }
      }
    });
  } catch (error) {
    console.error('Erreur inscription:', error);
    res.status(500).json({ error: 'Erreur lors de l\'inscription' });
  }
};

// ==========================
// CONNEXION (AJOUTÉE)
// ==========================
const login = async (req, res) => {
  try {
    const { clientEmail, password } = req.body;

    if (!clientEmail || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    const account = await Account.findOne({ clientEmail });
    if (!account) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    const isValidPassword = await bcrypt.compare(password, account.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    if (account.status === 'blocked') {
      return res.status(403).json({ error: 'Compte bloqué. Contactez l\'administrateur.' });
    }

    const token = jwt.sign(
      { id: account._id, email: account.clientEmail, role: account.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Connexion réussie',
      data: {
        token,
        user: {
          id: account._id,
          name: account.clientName,
          email: account.clientEmail,
          role: account.role,
          accountNumber: account.accountNumber,
          balance: account.balance,
          type: account.type,
          status: account.status
        }
      }
    });
  } catch (error) {
    console.error('Erreur connexion:', error);
    res.status(500).json({ error: 'Erreur lors de la connexion' });
  }
};

// ==========================
// VÉRIFICATION TOKEN
// ==========================
const verifyToken = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Token manquant' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const account = await Account.findById(decoded.id).select('-password');

    if (!account) {
      return res.status(401).json({ error: 'Utilisateur non trouvé' });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: account._id,
          name: account.clientName,
          email: account.clientEmail,
          role: account.role,
          accountNumber: account.accountNumber,
          balance: account.balance,
          type: account.type,
          status: account.status
        }
      }
    });
  } catch (error) {
    res.status(401).json({ error: 'Token invalide' });
  }
};

// ==========================
// EXPORT
// ==========================
module.exports = { register, login, verifyToken };