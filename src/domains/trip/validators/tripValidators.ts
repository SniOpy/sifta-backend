import { body, param, query, ValidationChain } from 'express-validator';
import { TRIP_STATUSES } from '../constants/tripStatus';
import { TripErrorMessages } from '../constants/errorMessages';

/**
 * Middleware de validation pour la création d'un trajet
 */
export const validateCreateTrip: ValidationChain[] = [
  body('from')
    .notEmpty()
    .withMessage(TripErrorMessages.VALIDATION.FROM_REQUIRED)
    .isString()
    .withMessage(TripErrorMessages.VALIDATION.FROM_REQUIRED)
    .isLength({ min: 1, max: 255 })
    .withMessage(TripErrorMessages.VALIDATION.FROM_TOO_LONG)
    .trim(),
  body('to')
    .notEmpty()
    .withMessage(TripErrorMessages.VALIDATION.TO_REQUIRED)
    .isString()
    .withMessage(TripErrorMessages.VALIDATION.TO_REQUIRED)
    .isLength({ min: 1, max: 255 })
    .withMessage(TripErrorMessages.VALIDATION.TO_TOO_LONG)
    .trim(),
  body('price')
    .optional()
    .isFloat({ min: 0, max: 999999.99 })
    .withMessage(TripErrorMessages.VALIDATION.PRICE_INVALID)
    .custom((value) => {
      if (value !== undefined && value !== null) {
        if (typeof value !== 'number' && typeof value !== 'string') {
          throw new Error(TripErrorMessages.VALIDATION.PRICE_INVALID);
        }
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        if (isNaN(numValue) || numValue < 0 || numValue > 999999.99) {
          throw new Error(TripErrorMessages.VALIDATION.PRICE_INVALID);
        }
      }
      return true;
    })
    .toFloat(),
  body('currency')
    .optional()
    .isString()
    .withMessage(TripErrorMessages.VALIDATION.CURRENCY_INVALID)
    .isLength({ min: 3, max: 3 })
    .withMessage(TripErrorMessages.VALIDATION.CURRENCY_INVALID)
    .trim()
    .toUpperCase(),
];

/**
 * Middleware de validation pour l'ID d'un trajet (paramètre URL)
 */
export const validateTripId: ValidationChain[] = [
  param('id')
    .notEmpty()
    .withMessage(TripErrorMessages.VALIDATION.TRIP_ID_INVALID)
    .isUUID()
    .withMessage(TripErrorMessages.VALIDATION.TRIP_ID_INVALID),
];

/**
 * Middleware de validation pour la pagination (query parameters)
 */
export const validatePagination: ValidationChain[] = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage(TripErrorMessages.VALIDATION.PAGE_INVALID)
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage(TripErrorMessages.VALIDATION.LIMIT_INVALID)
    .toInt(),
  query('status')
    .optional()
    .isString()
    .withMessage(TripErrorMessages.VALIDATION.STATUS_INVALID)
    .custom((value) => {
      if (!TRIP_STATUSES.includes(value as any)) {
        throw new Error(TripErrorMessages.VALIDATION.STATUS_INVALID);
      }
      return true;
    }),
];
