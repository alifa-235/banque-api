// src/controllers/accountController.js
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');

// Créer un compte (Admin)
const createAccount = async (req, res) => {
  try {
    const { clientName, clientEmail, password, type = 'courant', role = 'client', initialDeposit = 0 } = req.body;

    if (!clientName || !clientEmail || !password) {
      return res.status(400).json({ error: 'Champs requis manquants' });
    }

    const existingAccount = await Account.findOne({ clientEmail });
    if (existingAccount) {
      return res.status(400).json({ error: 'Cet email est déjà utilisé' });
    }

    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);

    const account = new Account({
      clientName,
      clientEmail,
      password: hashedPassword,
      type,
      role,
      balance: initialDeposit,
      currency: 'XAF',
      status: 'active'
    });

    await account.save();

    if (initialDeposit > 0) {
      const transaction = new Transaction({
        accountId: account._id,
        type: 'depot',
        amount: initialDeposit,
        description: 'Dépôt initial'
      });
      await transaction.save();
    }

    res.status(201).json({
      success: true,
      message: 'Compte créé avec succès',
      data: account
    });
  } catch (error) {
    console.error('Erreur création compte:', error);
    res.status(500).json({ error: 'Erreur lors de la création du compte' });
  }
};

// Liste tous les comptes (Admin)
const getAllAccounts = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, type, role } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (role) filter.role = role;

    const skip = (Number(page) - 1) * Number(limit);
    const limitNum = Number(limit);

    const [accounts, total] = await Promise.all([
      Account.find(filter)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Account.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: accounts,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Erreur liste comptes:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des comptes' });
  }
};

// Détails d'un compte (Admin)
const getAccountById = async (req, res) => {
  try {
    const { id } = req.params;

    const account = await Account.findById(id).select('-password');
    if (!account) {
      return res.status(404).json({ error: 'Compte non trouvé' });
    }

    const transactions = await Transaction.find({ accountId: id })
      .sort({ date: -1 })
      .limit(50);

    res.json({
      success: true,
      data: { ...account.toObject(), transactions }
    });
  } catch (error) {
    console.error('Erreur récupération compte:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du compte' });
  }
};

// Mettre à jour un compte (Admin)
const updateAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const { clientName, clientEmail, type, status } = req.body;

    const account = await Account.findById(id);
    if (!account) {
      return res.status(404).json({ error: 'Compte non trouvé' });
    }

    if (clientName) account.clientName = clientName;
    if (clientEmail) account.clientEmail = clientEmail;
    if (type) account.type = type;
    if (status) account.status = status;

    await account.save();

    res.json({
      success: true,
      message: 'Compte mis à jour avec succès',
      data: account
    });
  } catch (error) {
    console.error('Erreur mise à jour:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du compte' });
  }
};

// Supprimer un compte (Admin)
const deleteAccount = async (req, res) => {
  try {
    const { id } = req.params;

    const account = await Account.findByIdAndDelete(id);
    if (!account) {
      return res.status(404).json({ error: 'Compte non trouvé' });
    }

    res.json({
      success: true,
      message: 'Compte supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur suppression:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du compte' });
  }
};

// Dépôt
const deposit = async (req, res) => {
  try {
    const { accountId, amount, description } = req.body;

    if (!accountId || !amount || amount <= 0) {
      return res.status(400).json({ error: 'Montant invalide' });
    }

    const account = await Account.findById(accountId);
    if (!account) {
      return res.status(404).json({ error: 'Compte non trouvé' });
    }

    if (account.status !== 'active') {
      return res.status(403).json({ error: 'Compte inactif' });
    }

    account.balance += amount;
    account.updatedAt = new Date();
    await account.save();

    const transaction = new Transaction({
      accountId,
      type: 'depot',
      amount,
      description: description || `Dépôt de ${amount} ${account.currency}`
    });
    await transaction.save();

    res.json({
      success: true,
      message: 'Dépôt effectué avec succès',
      data: {
        newBalance: account.balance,
        transaction
      }
    });
  } catch (error) {
    console.error('Erreur dépôt:', error);
    res.status(500).json({ error: 'Erreur lors du dépôt' });
  }
};

// Retrait
const withdraw = async (req, res) => {
  try {
    const { accountId, amount, description } = req.body;

    if (!accountId || !amount || amount <= 0) {
      return res.status(400).json({ error: 'Montant invalide' });
    }

    const account = await Account.findById(accountId);
    if (!account) {
      return res.status(404).json({ error: 'Compte non trouvé' });
    }

    if (account.status !== 'active') {
      return res.status(403).json({ error: 'Compte inactif' });
    }

    if (account.balance < amount) {
      return res.status(400).json({ error: 'Solde insuffisant' });
    }

    account.balance -= amount;
    account.updatedAt = new Date();
    await account.save();

    const transaction = new Transaction({
      accountId,
      type: 'retrait',
      amount,
      description: description || `Retrait de ${amount} ${account.currency}`
    });
    await transaction.save();

    res.json({
      success: true,
      message: 'Retrait effectué avec succès',
      data: {
        newBalance: account.balance,
        transaction
      }
    });
  } catch (error) {
    console.error('Erreur retrait:', error);
    res.status(500).json({ error: 'Erreur lors du retrait' });
  }
};

// Virement
const transfer = async (req, res) => {
  try {
    const { fromAccountId, toAccountId, amount, description } = req.body;

    if (!fromAccountId || !toAccountId || !amount || amount <= 0) {
      return res.status(400).json({ error: 'Informations de virement invalides' });
    }

    if (fromAccountId === toAccountId) {
      return res.status(400).json({ error: 'Impossible de faire un virement vers le même compte' });
    }

    const fromAccount = await Account.findById(fromAccountId);
    const toAccount = await Account.findById(toAccountId);

    if (!fromAccount || !toAccount) {
      return res.status(404).json({ error: 'Compte source ou destinataire non trouvé' });
    }

    if (fromAccount.status !== 'active' || toAccount.status !== 'active') {
      return res.status(403).json({ error: 'Un des comptes est inactif' });
    }

    if (fromAccount.balance < amount) {
      return res.status(400).json({ error: 'Solde insuffisant sur le compte source' });
    }

    fromAccount.balance -= amount;
    toAccount.balance += amount;
    fromAccount.updatedAt = new Date();
    toAccount.updatedAt = new Date();

    await fromAccount.save();
    await toAccount.save();

    const [withdrawTransaction, depositTransaction] = await Promise.all([
      new Transaction({
        accountId: fromAccountId,
        type: 'virement',
        amount,
        description: description || `Virement vers ${toAccount.accountNumber}`,
        fromAccountId,
        toAccountId
      }).save(),
      new Transaction({
        accountId: toAccountId,
        type: 'virement',
        amount,
        description: description || `Virement de ${fromAccount.accountNumber}`,
        fromAccountId,
        toAccountId
      }).save()
    ]);

    res.json({
      success: true,
      message: 'Virement effectué avec succès',
      data: {
        fromAccountBalance: fromAccount.balance,
        toAccountBalance: toAccount.balance,
        transaction: withdrawTransaction
      }
    });
  } catch (error) {
    console.error('Erreur virement:', error);
    res.status(500).json({ error: 'Erreur lors du virement' });
  }
};

// Historique des transactions
const getTransactionHistory = async (req, res) => {
  try {
    const { accountId } = req.params;
    const { startDate, endDate, type, limit = 50, page = 1 } = req.query;

    const filter = { accountId };
    if (type) filter.type = type;
    if (startDate) filter.date = { $gte: new Date(startDate) };
    if (endDate) filter.date = { ...filter.date, $lte: new Date(endDate) };

    const skip = (Number(page) - 1) * Number(limit);

    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .sort({ date: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Transaction.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: transactions,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Erreur historique:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'historique' });
  }
};

// Récupérer son propre compte (Client)
const getMyAccount = async (req, res) => {
  try {
    const account = await Account.findById(req.user.id).select('-password');
    if (!account) {
      return res.status(404).json({ error: 'Compte non trouvé' });
    }

    const transactions = await Transaction.find({ accountId: account._id })
      .sort({ date: -1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        ...account.toObject(),
        recentTransactions: transactions
      }
    });
  } catch (error) {
    console.error('Erreur récupération compte:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du compte' });
  }
};

// Récupérer ses propres transactions (Client)
const getMyTransactions = async (req, res) => {
  try {
    const { limit = 50, type } = req.query;
    const accountId = req.user.id;

    const filter = { accountId };
    if (type) filter.type = type;

    const transactions = await Transaction.find(filter)
      .sort({ date: -1 })
      .limit(Number(limit));

    res.json({
      success: true,
      data: transactions,
      total: transactions.length
    });
  } catch (error) {
    console.error('Erreur historique:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'historique' });
  }
};

// src/controllers/accountController.js (ajouter cette fonction)

// Désactiver un compte (Admin)
const deactivateAccount = async (req, res) => {
  try {
    const { id } = req.params;

    const account = await Account.findById(id);
    if (!account) {
      return res.status(404).json({ error: 'Compte non trouvé' });
    }

    if (account.balance > 0) {
      return res.status(400).json({ error: 'Impossible de désactiver un compte avec un solde positif' });
    }

    account.status = 'inactive';
    account.updatedAt = new Date();
    await account.save();

    res.json({
      success: true,
      message: 'Compte désactivé avec succès',
      data: account
    });
  } catch (error) {
    console.error('Erreur désactivation:', error);
    res.status(500).json({ error: 'Erreur lors de la désactivation du compte' });
  }
};

// src/controllers/accountController.js

// Rechercher un compte par email (public)
const findAccountByEmail = async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ error: 'Email requis' });
    }

    const account = await Account.findOne({ clientEmail: email })
      .select('clientName clientEmail accountNumber status');

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
    res.status(500).json({ error: 'Erreur lors de la recherche du compte' });
  }
};

// Export
module.exports = {
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
  findAccountByEmail  // ← AJOUTER
};