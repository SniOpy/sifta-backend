import { Router, Request, Response } from 'express';
import { testConnection } from '../config/database';

const router = Router();

/**
 * Route GET /health
 * Retourne le statut du serveur et optionnellement de la base de données
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    // Test de la connexion DB (optionnel)
    const dbStatus = await testConnection();
    
    res.status(200).json({
      status: 'OK',
      database: dbStatus ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    // En cas d'erreur, on retourne quand même OK pour le serveur
    res.status(200).json({
      status: 'OK',
      database: 'error',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
