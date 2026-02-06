import { Router } from 'express';
import {
  createTrip,
  getTripById,
  getUserTrips,
  cancelTrip,
} from './controllers/tripController';
import {
  tripCreationRateLimit,
  tripCancellationRateLimit,
} from '../../middleware/rateLimit';
import {
  validateCreateTrip,
  validateTripId,
  validatePagination,
} from './validators/tripValidators';
import { checkValidationErrors } from '../../middleware/validate';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { authenticateJWT } from '../../middleware/authenticate';

const router = Router();

/**
 * Route POST /trips
 * Crée un nouveau trajet pour l'utilisateur authentifié avec le statut 'pending' par défaut
 * 
 * Middleware appliqué dans l'ordre:
 * 1. Authentification JWT (vérifie le token et injecte req.user)
 * 2. Rate limiting (10 créations/min par utilisateur)
 * 3. Validation (from, to, price, currency)
 * 4. Contrôleur (création du trajet)
 */
router.post(
  '/',
  authenticateJWT, // Authentification JWT en premier
  tripCreationRateLimit, // Rate limiting
  validateCreateTrip, // Validation
  checkValidationErrors, // Vérification des erreurs de validation
  asyncHandler(createTrip) // Contrôleur avec gestion automatique des erreurs
);

/**
 * Route GET /trips
 * Récupère la liste paginée des trajets de l'utilisateur authentifié
 * 
 * Middleware appliqué dans l'ordre:
 * 1. Authentification JWT (vérifie le token et injecte req.user)
 * 2. Validation pagination (page, limit, status) - optionnel
 * 3. Contrôleur (récupération des trajets avec filtres)
 */
router.get(
  '/',
  authenticateJWT, // Authentification JWT en premier
  validatePagination, // Validation pagination (optionnel)
  checkValidationErrors, // Vérification des erreurs de validation
  asyncHandler(getUserTrips) // Contrôleur avec gestion automatique des erreurs
);

/**
 * Route GET /trips/:id
 * Récupère les détails complets d'un trajet spécifique
 * Vérifie que l'utilisateur authentifié est propriétaire du trajet
 * 
 * Middleware appliqué dans l'ordre:
 * 1. Authentification JWT (vérifie le token et injecte req.user)
 * 2. Validation UUID (id)
 * 3. Contrôleur (récupération et vérification propriété)
 */
router.get(
  '/:id',
  authenticateJWT, // Authentification JWT en premier
  validateTripId, // Validation UUID
  checkValidationErrors, // Vérification des erreurs de validation
  asyncHandler(getTripById) // Contrôleur avec gestion automatique des erreurs
);

/**
 * Route POST /trips/:id/cancel
 * Annule un trajet (met le statut à 'cancelled')
 * Vérifie que le trajet peut être annulé (pas déjà completed ou cancelled)
 * 
 * Middleware appliqué dans l'ordre:
 * 1. Authentification JWT (vérifie le token et injecte req.user)
 * 2. Rate limiting (5 annulations/heure par utilisateur)
 * 3. Validation UUID (id)
 * 4. Contrôleur (annulation avec validation métier)
 */
router.post(
  '/:id/cancel',
  authenticateJWT, // Authentification JWT en premier
  tripCancellationRateLimit, // Rate limiting
  validateTripId, // Validation UUID
  checkValidationErrors, // Vérification des erreurs de validation
  asyncHandler(cancelTrip) // Contrôleur avec gestion automatique des erreurs
);

export default router;
