// scripts/seed-mongo.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Account = require('../src/models/Account');
const Transaction = require('../src/models/Transaction');

dotenv.config();

const seedDatabase = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/banque_db';
    await mongoose.connect(mongoURI);
    console.log('✅ Connecté à MongoDB');

    // Supprimer les données existantes
    await Account.deleteMany({});
    await Transaction.deleteMany({});
    console.log('🗑️ Anciennes données supprimées');

    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Créer les comptes (le hook générera automatiquement les numéros)
    const accounts = await Account.create([
      {
        clientName: 'Jean Dupont',
        clientEmail: 'jean@demo.com',
        password: hashedPassword,
        type: 'courant',
        role: 'client',
        balance: 1000000,
        currency: 'XAF',
        status: 'active'
      },
      {
        clientName: 'Marie Claire',
        clientEmail: 'marie@demo.com',
        password: hashedPassword,
        type: 'epargne',
        role: 'client',
        balance: 5000000,
        currency: 'XAF',
        status: 'active'
      }
    ]);

    console.log(`✅ ${accounts.length} comptes créés`);
    console.log('📋 Comptes :');
    accounts.forEach(acc => {
      console.log(`   - ${acc.clientName} (${acc.accountNumber}) - ${acc.role} - ${acc.balance} XAF`);
    });

    // Créer des transactions de test
    if (accounts.length >= 2) {
      await Transaction.create([
        {
          accountId: accounts[0]._id,
          type: 'depot',
          amount: 500000,
          description: 'Dépôt initial'
        },
        {
          accountId: accounts[1]._id,
          type: 'depot',
          amount: 200000,
          description: 'Dépôt initial'
        }
      ]);
      console.log(`✅ Transactions créées`);
    }

    console.log('\n🔐 Identifiants de test :');
    console.log('📧 Client: jean@demo.com / password123');
    console.log('📧 Client: marie@demo.com / password123');
    //console.log('🔑 Admin: admin@demo.com / password123');

    await mongoose.disconnect();
    console.log('\n👋 Déconnecté de MongoDB');
  } catch (error) {
    console.error('❌ Erreur lors du seed:', error.message);
    process.exit(1);
  }
};

seedDatabase();