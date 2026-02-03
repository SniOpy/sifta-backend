import { Router } from 'express';
import { requestOTP, verifyOTPController, refreshTokenController } from './controllers/authController';
import { otpRateLimit } from '../../middleware/rateLimit';
import { validateRequestOTP, validateVerifyOTP, validateRefreshToken } from './validators/authValidators';
import { checkValidationErrors } from '../../middleware/validate';

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
  requestOTP // Contrôleur
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
  verifyOTPController // Contrôleur
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
  refreshTokenController // Contrôleur
);

export default router;
