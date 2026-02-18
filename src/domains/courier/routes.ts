import { Router } from 'express';
import {
  getCourierAccount,
  settleCourierAccount,
} from './controllers/courierController';
import {
  validateCourierId,
} from './validators/courierValidators';
import { checkValidationErrors } from '../../middleware/validate';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { authenticateJWT } from '../../middleware/authenticate';
import { authorizeAdmin } from '../../middleware/authorizeAdmin';

const router = Router();

/**
 * Route GET /couriers/:id/account
 * Récupère le compte d'un livreur (commission, total_jobs, etc.)
 * Accessible par le livreur lui-même ou un admin
 * 
 * Middleware appliqué dans l'ordre:
 * 1. Authentification JWT (vérifie le token et injecte req.user)
 * 2. Validation de l'ID du livreur (paramètre URL)
 * 3. Contrôleur (récupération du compte)
 */
router.get(
  '/:id/account',
  authenticateJWT, // Authentification JWT en premier
  validateCourierId, // Validation de l'ID (paramètre URL)
  checkValidationErrors, // Vérification des erreurs de validation
  asyncHandler(getCourierAccount) // Contrôleur avec gestion automatique des erreurs
);

/**
 * Route POST /couriers/:id/settle
 * Règle la commission d'un livreur (admin only)
 * Remet commission_due à 0 et met à jour last_settlement_at
 * 
 * Middleware appliqué dans l'ordre:
 * 1. Authentification JWT (vérifie le token et injecte req.user)
 * 2. Autorisation admin (vérifie que l'utilisateur est admin)
 * 3. Validation de l'ID du livreur (paramètre URL)
 * 4. Contrôleur (règlement de la commission)
 */
router.post(
  '/:id/settle',
  authenticateJWT, // Authentification JWT en premier
  authorizeAdmin, // Vérification des droits admin
  validateCourierId, // Validation de l'ID (paramètre URL)
  checkValidationErrors, // Vérification des erreurs de validation
  asyncHandler(settleCourierAccount) // Contrôleur avec gestion automatique des erreurs
);

export default router;
