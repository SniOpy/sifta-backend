import express, { Express } from 'express';
import dotenv from 'dotenv';
import { connectDB } from './config/database';
import healthRoutes from './routes/health';
import authRoutes from './routes/auth';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Charger les variables d'environnement
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Middleware pour parser le JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'SOKHRA, Backend API' });
});

app.use('/', healthRoutes);
app.use('/api/v1/auth', authRoutes);


// Gestion des erreurs 404
app.use(notFoundHandler);

// Middleware de gestion d'erreurs global (doit être en dernier)
app.use(errorHandler);

// Démarrage du serveur
async function startServer() {
  try {
    // Connexion à la base de données
    await connectDB();
    
    // Démarrage du serveur Express
    app.listen(PORT, () => {
      console.log(`🚀 Serveur démarré sur le port ${PORT}`);
      console.log(`📍 Health check disponible sur http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Erreur lors du démarrage du serveur:', error);
    process.exit(1);
  }
}

// Gestion des erreurs non capturées
process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Démarrer le serveur
startServer();
