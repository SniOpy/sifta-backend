import { body, ValidationChain } from 'express-validator';
import { validatePhoneFormat, normalizePhone } from '../../../shared/utils/phoneValidator';

/**
 * Middleware de validation pour la demande d'OTP (S05-BE-Correction: role obligatoire).
 */
export const validateRequestOTP: ValidationChain[] = [
  body('phone')
    .notEmpty()
    .withMessage('Le numéro de téléphone est requis')
    .isString()
    .custom((value) => {
      const validation = validatePhoneFormat(value);
      if (!validation.valid) throw new Error(validation.error || 'Format de téléphone invalide');
      return true;
    })
    .customSanitizer((value) => normalizePhone(value)),
  body('role')
    .notEmpty()
    .withMessage('Le rôle est requis (seller ou courier)')
    .isIn(['seller', 'courier'])
    .withMessage('Le rôle doit être "seller" ou "courier"'),
];

/**
 * Middleware de validation pour la vérification d'OTP
 */
export const validateVerifyOTP: ValidationChain[] = [
  body('phone')
    .notEmpty()
    .withMessage('Le numéro de téléphone est requis')
    .isString()
    .withMessage('Le numéro de téléphone doit être une chaîne de caractères')
    .custom((value) => {
      const validation = validatePhoneFormat(value);
      if (!validation.valid) {
        throw new Error(validation.error || 'Format de téléphone invalide');
      }
      return true;
    })
    .customSanitizer((value) => {
      // Normaliser le téléphone avant de continuer
      return normalizePhone(value);
    }),
  body('code')
    .notEmpty()
    .withMessage('Le code OTP est requis')
    .isString()
    .withMessage('Le code OTP doit être une chaîne de caractères')
    .isLength({ min: 6, max: 6 })
    .withMessage('Le code OTP doit contenir exactement 6 chiffres')
    .matches(/^\d+$/)
    .withMessage('Le code OTP doit contenir uniquement des chiffres'),
];

/**
 * Middleware de validation pour le rafraîchissement de token
 */
export const validateRefreshToken: ValidationChain[] = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Le refresh token est requis')
    .isString()
    .withMessage('Le refresh token doit être une chaîne de caractères')
    .isUUID()
    .withMessage('Le refresh token doit être un UUID valide'),
];
