// src/app.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { setupSwagger } from './config/swagger';
import accountRoutes from './routes/accountRoutes';

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

// Swagger - Documentation interactive
setupSwagger(app);

// Routes
app.use('/api', accountRoutes);

// Route de santé
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date(),
    storage: 'In-Memory (données temporaires)',
    swagger: 'http://localhost:3000/api-docs'
  });
});

// Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Serveur démarré sur http://localhost:${PORT}`);
  console.log(`📚 Documentation Swagger: http://localhost:${PORT}/api-docs`);
  console.log(`💾 Stockage: En mémoire (les données seront perdues au redémarrage)\n`);
});

export default app;