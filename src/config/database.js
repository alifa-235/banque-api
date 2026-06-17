// src/config/database.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Elle cherchera automatiquement la variable MONGODB_URI configurée sur Render
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
        console.error("❌ La variable d'environnement MONGODB_URI n'est pas définie.");
        process.exit(1);
    }

    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB Atlas connecté avec succès');
  } catch (error) {
    console.error('❌ Erreur de connexion à MongoDB Atlas:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;