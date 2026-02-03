import { body, ValidationChain, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { validatePhoneFormat, normalizePhone } from '../utils/phoneValidator';

/**
 * Middleware de validation pour la demande d'OTP
 */
export const validateRequestOTP: ValidationChain[] = [
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
 * Middleware pour vérifier les résultats de validation
 * Doit être utilisé après les validateurs express-validator
 */
export function checkValidationErrors(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors: Record<string, string> = {};
    errors.array().forEach((error) => {
      if (error.type === 'field') {
        formattedErrors[error.path] = error.msg;
      }
    });

    res.status(400).json({
      success: false,
      error: 'Validation error',
      details: formattedErrors,
    });
    return;
  }

  // Le téléphone a été normalisé par le sanitizer, on le remet dans le body
  if (req.body.phone) {
    req.body.phone = normalizePhone(req.body.phone);
  }

  next();
}
