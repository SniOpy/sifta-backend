import express, { Express } from 'express';
import dotenv from 'dotenv';
import { connectDB } from './config/database';
import healthRoutes from './routes/health';

// Charger les variables d'environnement
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Middleware pour parser le JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/', healthRoutes);

// Route racine optionnelle
app.get('/', (req, res) => {
  res.json({ message: 'SOKHRA, Backend API' });
});

// Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

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
