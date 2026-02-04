import express, { Express } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { connectDB } from './config/database';
import { validateEnv } from './config/env';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { startOTPCleanupJob } from './shared/utils/cleanup';

// Charger les variables d'environnement
dotenv.config();

// Valider les variables d'environnement requises avant de continuer
try {
  validateEnv();
} catch (error: any) {
  console.error('❌ Erreur de configuration:', error.message);
  process.exit(1);
}

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Configuration CORS pour permettre les requêtes depuis le frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Middleware pour parser le JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'SOKHRA, Backend API' });
});

app.use('/api/v1', routes);


// Gestion des erreurs 404
app.use(notFoundHandler);

// Middleware de gestion d'erreurs global (doit être en dernier)
app.use(errorHandler);

// Démarrage du serveur
async function startServer() {
  try {
    // Connexion à la base de données
    await connectDB();

    // Démarrer le job de nettoyage automatique des OTP expirés
    const cleanupInterval = parseInt(
      process.env.OTP_CLEANUP_INTERVAL_MINUTES || '60',
      10
    );
    startOTPCleanupJob(cleanupInterval);

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
