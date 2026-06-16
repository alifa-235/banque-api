// src/app.js
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const connectDB = require('./config/database');
const accountRoutes = require('./routes/accountRoutes');

dotenv.config();

const app = express();

// Connexion à MongoDB
connectDB();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

// Routes
app.use('/api', accountRoutes);

// Route de santé
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date(),
    database: 'MongoDB',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

// Gestion globale des erreurs
app.use((err, req, res, next) => {
  console.error('Erreur globale:', err.stack);
  res.status(500).json({ error: 'Erreur interne du serveur' });
});

module.exports = app;