import { Router } from 'express';
import { requestOTP, verifyOTPController } from '../controllers/authController';
import { otpRateLimit } from '../middleware/rateLimit';
import { validateRequestOTP, validateVerifyOTP, checkValidationErrors } from '../middleware/validate';

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

export default router;
