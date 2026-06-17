// scripts/test-hook.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Account = require('../src/models/Account');

dotenv.config();

const testHook = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté');

    // Créer un compte avec new Account() + save()
    const account = new Account({
      clientName: 'Test Hook',
      clientEmail: 'test@hook.com',
      password: 'password123',
      type: 'courant',
      role: 'client',
      balance: 1000,
      currency: 'XAF',
      status: 'active'
    });

    console.log('📝 Avant save - accountNumber:', account.accountNumber);
    await account.save();
    console.log('✅ Après save - accountNumber:', account.accountNumber);

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
};

testHook();