// src/index.js
const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`\n🚀 Serveur démarré sur http://localhost:${PORT}`);
  console.log(`📊 API disponible sur /api`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`💾 Base de données: MongoDB\n`);
});