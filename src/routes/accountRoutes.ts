// src/routes/accountRoutes.ts
import { Router } from 'express';
import {
  createAccount,
  getAllAccounts,
  getAccountById,
  deposit,
  withdraw,
  transfer,
  getTransactionHistory,
  deactivateAccount
} from '../controllers/accountController';

const router = Router();

/**
 * @swagger
 * /api/accounts:
 *   post:
 *     summary: Créer un nouveau compte bancaire
 *     description: Crée un compte avec un dépôt initial optionnel
 *     tags: [Comptes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - clientName
 *               - clientEmail
 *               - type
 *             properties:
 *               clientName:
 *                 type: string
 *                 example: "Jean Dupont"
 *               clientEmail:
 *                 type: string
 *                 example: "jean@email.com"
 *               type:
 *                 type: string
 *                 enum: [courant, epargne]
 *                 example: "courant"
 *               initialDeposit:
 *                 type: number
 *                 example: 100000
 *               currency:
 *                 type: string
 *                 example: "XAF"
 *     responses:
 *       201:
 *         description: Compte créé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Account'
 *       400:
 *         description: Données invalides ou email déjà existant
 */
router.post('/accounts', createAccount);

/**
 * @swagger
 * /api/accounts:
 *   get:
 *     summary: Liste tous les comptes
 *     description: Retourne la liste paginée de tous les comptes
 *     tags: [Comptes]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Numéro de la page
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Nombre d'éléments par page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *         description: Filtrer par statut
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [courant, epargne]
 *         description: Filtrer par type de compte
 *     responses:
 *       200:
 *         description: Liste des comptes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Account'
 *                 pagination:
 *                   type: object
 */
router.get('/accounts', getAllAccounts);

/**
 * @swagger
 * /api/accounts/{id}:
 *   get:
 *     summary: Détails d'un compte
 *     description: Retourne les informations d'un compte spécifique avec son historique
 *     tags: [Comptes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du compte
 *     responses:
 *       200:
 *         description: Détails du compte
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Account'
 *       404:
 *         description: Compte non trouvé
 */
router.get('/accounts/:id', getAccountById);

/**
 * @swagger
 * /api/deposit:
 *   post:
 *     summary: Effectuer un dépôt
 *     description: Dépose de l'argent sur un compte
 *     tags: [Transactions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accountId
 *               - amount
 *             properties:
 *               accountId:
 *                 type: string
 *                 example: "123e4567-e89b-12d3-a456-426614174000"
 *               amount:
 *                 type: number
 *                 example: 50000
 *               description:
 *                 type: string
 *                 example: "Dépôt espèces"
 *     responses:
 *       200:
 *         description: Dépôt effectué avec succès
 *       400:
 *         description: Montant invalide
 *       404:
 *         description: Compte non trouvé
 */
router.post('/deposit', deposit);

/**
 * @swagger
 * /api/withdraw:
 *   post:
 *     summary: Effectuer un retrait
 *     description: Retire de l'argent d'un compte
 *     tags: [Transactions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accountId
 *               - amount
 *             properties:
 *               accountId:
 *                 type: string
 *               amount:
 *                 type: number
 *                 example: 25000
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Retrait effectué
 *       400:
 *         description: Montant invalide ou solde insuffisant
 *       404:
 *         description: Compte non trouvé
 */
router.post('/withdraw', withdraw);

/**
 * @swagger
 * /api/transfer:
 *   post:
 *     summary: Effectuer un virement
 *     description: Transfère de l'argent entre deux comptes
 *     tags: [Transactions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fromAccountId
 *               - toAccountId
 *               - amount
 *             properties:
 *               fromAccountId:
 *                 type: string
 *               toAccountId:
 *                 type: string
 *               amount:
 *                 type: number
 *                 example: 30000
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Virement effectué
 *       400:
 *         description: Paramètres invalides ou solde insuffisant
 *       404:
 *         description: Compte non trouvé
 */
router.post('/transfer', transfer);

/**
 * @swagger
 * /api/accounts/{accountId}/history:
 *   get:
 *     summary: Historique des transactions
 *     description: Retourne l'historique des transactions d'un compte
 *     tags: [Transactions]
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du compte
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Nombre de transactions à retourner
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [depot, retrait, virement]
 *         description: Filtrer par type de transaction
 *     responses:
 *       200:
 *         description: Historique des transactions
 *       404:
 *         description: Compte non trouvé
 */
router.get('/accounts/:accountId/history', getTransactionHistory);

/**
 * @swagger
 * /api/accounts/{id}:
 *   delete:
 *     summary: Désactiver un compte
 *     description: Désactive un compte (solde doit être à 0)
 *     tags: [Comptes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Compte désactivé
 *       400:
 *         description: Compte avec solde positif
 *       404:
 *         description: Compte non trouvé
 */
router.delete('/accounts/:id', deactivateAccount);

export default router;