// src/tests/setup.js
import { beforeAll, afterAll, afterEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import dotenv from 'dotenv';

dotenv.config();

let mongoServer;

beforeAll(async () => {
  // Utiliser MongoDB Memory Server pour les tests unitaires
  // ou la base de données réelle pour les tests d'intégration
  const useRealDb = process.env.USE_REAL_DB === 'true';
  
  if (useRealDb) {
    // Utiliser la base de données réelle
    const realUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/banque_db';
    await mongoose.connect(realUri);
    console.log('✅ Connexion à la base de données réelle');
  } else {
    // Utiliser MongoDB Memory Server
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    console.log('✅ Base de données mémoire créée');
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
  console.log('👋 Déconnexion de la base de données');
});

afterEach(async () => {
  // Nettoyer les collections après chaque test
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

export { mongoServer };