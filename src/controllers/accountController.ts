// src/controllers/accountController.ts (version mémoire)
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { ITransaction, TransactionType } from '../models/Account';

// Stockage en mémoire (les données sont conservées tant que le serveur tourne)
let accounts: any[] = [];
let transactions: any[] = [];

const generateAccountNumber = (): string => {
  return 'FR76' + Math.floor(Math.random() * 100000000000000000).toString().padStart(14, '0');
};

// UC1: Créer un compte
export const createAccount = async (req: Request, res: Response) => {
  try {
    const { clientName, clientEmail, type, initialDeposit = 0, currency = 'XAF' } = req.body;

    if (!clientName || !clientEmail || !type) {
      return res.status(400).json({ error: 'Champs requis manquants' });
    }

    // Vérifier si l'email existe déjà
    const existingAccount = accounts.find(acc => acc.clientEmail === clientEmail);
    if (existingAccount) {
      return res.status(400).json({ error: 'Un compte existe déjà avec cet email' });
    }

    const newAccount = {
      id: uuidv4(),
      accountNumber: generateAccountNumber(),
      clientName,
      clientEmail,
      type,
      balance: initialDeposit,
      currency,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    accounts.push(newAccount);

    if (initialDeposit > 0) {
      transactions.push({
        id: uuidv4(),
        accountId: newAccount.id,
        type: 'depot',
        amount: initialDeposit,
        description: 'Dépôt initial',
        date: new Date()
      });
    }

    res.status(201).json({
      success: true,
      message: 'Compte créé avec succès',
      data: newAccount
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la création du compte' });
  }
};

// UC2: Liste de tous les comptes
export const getAllAccounts = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, status, type } = req.query;

    let filteredAccounts = [...accounts];

    if (status) {
      filteredAccounts = filteredAccounts.filter(acc => acc.status === status);
    }
    if (type) {
      filteredAccounts = filteredAccounts.filter(acc => acc.type === type);
    }

    const start = (Number(page) - 1) * Number(limit);
    const paginatedAccounts = filteredAccounts.slice(start, start + Number(limit));

    res.json({
      success: true,
      data: paginatedAccounts,
      pagination: {
        total: filteredAccounts.length,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(filteredAccounts.length / Number(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des comptes' });
  }
};

// ... (les autres fonctions restent identiques)

// UC3: Consulter un compte spécifique
export const getAccountById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const account = accounts.find(acc => acc.id === id);

    if (!account) {
      return res.status(404).json({ error: 'Compte non trouvé' });
    }

    // Récupérer les transactions du compte
    const accountTransactions = transactions.filter(t => t.accountId === id);

    res.json({
      success: true,
      data: {
        ...account,
        transactions: accountTransactions
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération du compte' });
  }
};

// UC4: Effectuer un dépôt
export const deposit = async (req: Request, res: Response) => {
  try {
    const { accountId, amount, description } = req.body;

    if (!accountId || !amount || amount <= 0) {
      return res.status(400).json({ error: 'Montant invalide' });
    }

    const account = accounts.find(acc => acc.id === accountId);
    if (!account) {
      return res.status(404).json({ error: 'Compte non trouvé' });
    }

    if (account.status !== 'active') {
      return res.status(403).json({ error: 'Compte inactif' });
    }

    // Mettre à jour le solde
    account.balance += amount;
    account.updatedAt = new Date();

    // Enregistrer la transaction
    const transaction: ITransaction = {
      id: uuidv4(),
      accountId,
      type: TransactionType.DEPOSIT,
      amount,
      description: description || `Dépôt de ${amount} ${account.currency}`,
      date: new Date()
    };
    transactions.push(transaction);

    res.json({
      success: true,
      message: 'Dépôt effectué avec succès',
      data: {
        newBalance: account.balance,
        transaction
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors du dépôt' });
  }
};

// UC5: Effectuer un retrait
export const withdraw = async (req: Request, res: Response) => {
  try {
    const { accountId, amount, description } = req.body;

    if (!accountId || !amount || amount <= 0) {
      return res.status(400).json({ error: 'Montant invalide' });
    }

    const account = accounts.find(acc => acc.id === accountId);
    if (!account) {
      return res.status(404).json({ error: 'Compte non trouvé' });
    }

    if (account.status !== 'active') {
      return res.status(403).json({ error: 'Compte inactif' });
    }

    if (account.balance < amount) {
      return res.status(400).json({ error: 'Solde insuffisant' });
    }

    // Mettre à jour le solde
    account.balance -= amount;
    account.updatedAt = new Date();

    // Enregistrer la transaction
    const transaction: ITransaction = {
      id: uuidv4(),
      accountId,
      type: TransactionType.WITHDRAWAL,
      amount,
      description: description || `Retrait de ${amount} ${account.currency}`,
      date: new Date()
    };
    transactions.push(transaction);

    res.json({
      success: true,
      message: 'Retrait effectué avec succès',
      data: {
        newBalance: account.balance,
        transaction
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors du retrait' });
  }
};

// UC6: Virement entre comptes
export const transfer = async (req: Request, res: Response) => {
  try {
    const { fromAccountId, toAccountId, amount, description } = req.body;

    if (!fromAccountId || !toAccountId || !amount || amount <= 0) {
      return res.status(400).json({ error: 'Informations de virement invalides' });
    }

    if (fromAccountId === toAccountId) {
      return res.status(400).json({ error: 'Impossible de faire un virement vers le même compte' });
    }

    const fromAccount = accounts.find(acc => acc.id === fromAccountId);
    const toAccount = accounts.find(acc => acc.id === toAccountId);

    if (!fromAccount || !toAccount) {
      return res.status(404).json({ error: 'Compte source ou destinataire non trouvé' });
    }

    if (fromAccount.status !== 'active' || toAccount.status !== 'active') {
      return res.status(403).json({ error: 'Un des comptes est inactif' });
    }

    if (fromAccount.balance < amount) {
      return res.status(400).json({ error: 'Solde insuffisant sur le compte source' });
    }

    // Effectuer le virement
    fromAccount.balance -= amount;
    toAccount.balance += amount;
    fromAccount.updatedAt = new Date();
    toAccount.updatedAt = new Date();

    // Enregistrer les transactions
    const withdrawalTransaction: ITransaction = {
      id: uuidv4(),
      accountId: fromAccountId,
      type: TransactionType.TRANSFER,
      amount,
      description: description || `Virement vers ${toAccount.accountNumber}`,
      fromAccountId,
      toAccountId,
      date: new Date()
    };

    const depositTransaction: ITransaction = {
      id: uuidv4(),
      accountId: toAccountId,
      type: TransactionType.TRANSFER,
      amount,
      description: description || `Virement de ${fromAccount.accountNumber}`,
      fromAccountId,
      toAccountId,
      date: new Date()
    };

    transactions.push(withdrawalTransaction, depositTransaction);

    res.json({
      success: true,
      message: 'Virement effectué avec succès',
      data: {
        fromAccountBalance: fromAccount.balance,
        toAccountBalance: toAccount.balance,
        transaction: withdrawalTransaction
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors du virement' });
  }
};

// UC7: Consulter l'historique des transactions
export const getTransactionHistory = async (req: Request, res: Response) => {
  try {
    const { accountId } = req.params;
    const { startDate, endDate, type, limit = 50 } = req.query;

    let accountTransactions = transactions.filter(t => t.accountId === accountId);

    if (type) {
      accountTransactions = accountTransactions.filter(t => t.type === type);
    }

    if (startDate) {
      accountTransactions = accountTransactions.filter(t => t.date >= new Date(startDate as string));
    }

    if (endDate) {
      accountTransactions = accountTransactions.filter(t => t.date <= new Date(endDate as string));
    }

    // Trier par date décroissante
    accountTransactions.sort((a, b) => b.date.getTime() - a.date.getTime());

    res.json({
      success: true,
      data: accountTransactions.slice(0, Number(limit)),
      total: accountTransactions.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'historique' });
  }
};

// UC8: Désactiver un compte
export const deactivateAccount = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const account = accounts.find(acc => acc.id === id);

    if (!account) {
      return res.status(404).json({ error: 'Compte non trouvé' });
    }

    if (account.balance > 0) {
      return res.status(400).json({ error: 'Impossible de désactiver un compte avec un solde positif' });
    }

    account.status = 'inactive';
    account.updatedAt = new Date();

    res.json({
      success: true,
      message: 'Compte désactivé avec succès',
      data: account
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la désactivation du compte' });
  }
};