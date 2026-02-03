import { Router } from 'express';
import { getCurrentUser } from './controllers/userController';
import { authenticateJWT } from '../../middleware/authenticate';
import { asyncHandler } from '../../shared/utils/asyncHandler';

const router = Router();

/**
 * Route GET /me
 * Route protégée nécessitant une authentification JWT
 * Retourne les informations de l'utilisateur authentifié
 * 
 * Middleware appliqué dans l'ordre:
 * 1. Authentification JWT (vérifie le token et injecte req.user)
 * 2. Contrôleur (retourne les informations utilisateur complètes depuis la DB)
 */
router.get(
  '/me',
  authenticateJWT, // Authentification JWT en premier
  asyncHandler(getCurrentUser) // Contrôleur avec gestion automatique des erreurs
);

export default router;
