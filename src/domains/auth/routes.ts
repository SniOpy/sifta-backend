import { Router } from 'express';
import { requestOTP, verifyOTPController, refreshTokenController, getCurrentUser, logoutController } from './controllers/authController';
import { otpRateLimit } from '../../middleware/rateLimit';
import { validateRequestOTP, validateVerifyOTP, validateRefreshToken } from './validators/authValidators';
import { checkValidationErrors } from '../../middleware/validate';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { authenticateJWT } from '../../middleware/authenticate';

const router = Router();

/**
 * Route POST /request-otp
 * Permet à un utilisateur de demander un code OTP via son numéro de téléphone
 * 
 * Middleware appliqué dans l'ordre:
 * 1. Rate limiting (par téléphone)
 * 2. Validation (format téléphone)
 * 3. Contrôleur (génération et envoi OTP)
 */
router.post(
  '/request-otp',
  otpRateLimit, // Rate limiting en premier
  validateRequestOTP, // Validation
  checkValidationErrors, // Vérification des erreurs de validation
  asyncHandler(requestOTP) // Contrôleur avec gestion automatique des erreurs
);

/**
 * Route POST /verify-otp
 * Permet à un utilisateur de vérifier un code OTP
 * 
 * Middleware appliqué dans l'ordre:
 * 1. Rate limiting (par téléphone)
 * 2. Validation (format téléphone et code OTP)
 * 3. Contrôleur (vérification OTP, gestion expiration, limitation tentatives)
 */
router.post(
  '/verify-otp',
  otpRateLimit, // Rate limiting en premier
  validateVerifyOTP, // Validation
  checkValidationErrors, // Vérification des erreurs de validation
  asyncHandler(verifyOTPController) // Contrôleur avec gestion automatique des erreurs
);

/**
 * Route POST /refresh
 * Permet à un utilisateur de rafraîchir ses tokens (access + refresh)
 * 
 * Middleware appliqué dans l'ordre:
 * 1. Rate limiting (par IP ou token)
 * 2. Validation (format refresh token)
 * 3. Contrôleur (validation token, rotation, génération nouveaux tokens)
 */
router.post(
  '/refresh',
  otpRateLimit, // Rate limiting en premier
  validateRefreshToken, // Validation
  checkValidationErrors, // Vérification des erreurs de validation
  asyncHandler(refreshTokenController) // Contrôleur avec gestion automatique des erreurs
);

/**
 * Route GET /me
 * Route protégée nécessitant une authentification JWT
 * Retourne les informations de l'utilisateur authentifié
 * 
 * Middleware appliqué dans l'ordre:
 * 1. Authentification JWT (vérifie le token et injecte req.user)
 * 2. Contrôleur (retourne les informations utilisateur)
 */
router.get(
  '/me',
  authenticateJWT, // Authentification JWT en premier
  asyncHandler(getCurrentUser) // Contrôleur avec gestion automatique des erreurs
);

/**
 * Route POST /logout
 * Route protégée nécessitant une authentification JWT
 * Révoque tous les refresh tokens de l'utilisateur, invalidant sa session sur tous les appareils
 * 
 * Middleware appliqué dans l'ordre:
 * 1. Authentification JWT (vérifie le token et injecte req.user)
 * 2. Contrôleur (révoque tous les refresh tokens de l'utilisateur)
 */
router.post(
  '/logout',
  authenticateJWT, // Authentification JWT en premier
  asyncHandler(logoutController) // Contrôleur avec gestion automatique des erreurs
);

export default router;
