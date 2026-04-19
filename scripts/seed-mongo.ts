// scripts/seed-mongo.ts
import mongoose from 'mongoose';
import { Account } from '../src/models/Account';
import dotenv from 'dotenv';

dotenv.config();

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('Connected to MongoDB');

    // Supprimer les données existantes
    await Account.deleteMany({});
    console.log('Cleared existing accounts');

    // Créer des comptes de test
    const accounts = await Account.create([
      {
        clientName: 'Jean Dupont',
        clientEmail: 'jean@demo.com',
        type: 'courant',
        balance: 1000000,
        currency: 'XAF'
      },
      {
        clientName: 'Marie Claire',
        clientEmail: 'marie@demo.com',
        type: 'epargne',
        balance: 5000000,
        currency: 'XAF'
      }
    ]);

    console.log(`✅ ${accounts.length} comptes créés`);
    console.log(accounts);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();