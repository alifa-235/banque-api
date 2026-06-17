// src/models/Account.js
const mongoose = require('mongoose');

const AccountSchema = new mongoose.Schema(
  {
    accountNumber: {
      type: String,
      required: false,  // ← MIS À false TEMPORAIREMENT pour que le seed fonctionne
      unique: true,
      trim: true
    },
    clientName: {
      type: String,
      required: true,
      trim: true
    },
    clientEmail: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true,
      minlength: 6
    },
    role: {
      type: String,
      enum: ['client', 'admin'],
      default: 'client'
    },
    type: {
      type: String,
      enum: ['courant', 'epargne'],
      required: true,
      default: 'courant'
    },
    balance: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },
    currency: {
      type: String,
      required: true,
      default: 'XAF'
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'blocked'],
      default: 'active'
    }
  },
  {
    timestamps: true
  }
);

// Hook pour générer automatiquement le numéro de compte
AccountSchema.pre('save', async function(next) {
  if (!this.accountNumber) {
    const generateAccountNumber = () => {
      return 'FR76' + Math.floor(Math.random() * 100000000000000000).toString().padStart(14, '0');
    };
    
    let accountNumber = generateAccountNumber();
    let exists = await mongoose.model('Account').findOne({ accountNumber });
    
    while (exists) {
      accountNumber = generateAccountNumber();
      exists = await mongoose.model('Account').findOne({ accountNumber });
    }
    
    this.accountNumber = accountNumber;
  }
  next();
});

module.exports = mongoose.model('Account', AccountSchema);
