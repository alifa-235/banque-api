// src/models/Transaction.js
const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema(
  {
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      required: true
    },
    type: {
      type: String,
      enum: ['depot', 'retrait', 'virement'],
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    description: {
      type: String,
      trim: true
    },
    fromAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account'
    },
    toAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account'
    },
    date: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Index pour les requêtes fréquentes
TransactionSchema.index({ accountId: 1, date: -1 });
TransactionSchema.index({ accountId: 1, type: 1 });
TransactionSchema.index({ date: -1 });

module.exports = mongoose.model('Transaction', TransactionSchema);