// // src/index.ts
// import app from './app';

// const PORT = process.env.PORT || 3000;

// app.listen(PORT, () => {
//   console.log(`Serveur démarré sur http://localhost:${PORT}`);
//   console.log(`API Health: http://localhost:${PORT}/health`);
// });

// src/index.ts
import app from './app';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});