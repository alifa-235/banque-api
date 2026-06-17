// scripts/create-admin.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Account = require('../src/models/Account');
require('dotenv').config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://...');

    const adminEmail = 'admin@demo.com';
    const existingAdmin = await Account.findOne({ clientEmail: adminEmail });

    if (existingAdmin) {
      console.log('✅ Admin déjà existant');
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash('admin123', 10);

    const admin = new Account({
      clientName: 'Administrateur',
      clientEmail: adminEmail,
      password: hashedPassword,
      type: 'courant',
      role: 'admin',
      balance: 0,
      currency: 'XAF',
      status: 'active'
    });

    await admin.save();
    console.log('✅ Compte admin créé avec succès');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Mot de passe: admin123`);

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
};

createAdmin();