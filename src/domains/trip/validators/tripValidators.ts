import { body, param, query, ValidationChain } from 'express-validator';
import { TRIP_STATUSES } from '../constants/tripStatus';
import { TripErrorMessages } from '../constants/errorMessages';

/**
 * Valide une URL de lieu (http/https, max 500 caractères)
 */
const locationUrlChain = (field: 'pickup_location_url' | 'dropoff_location_url', required: boolean): ValidationChain[] => {
  const chain = body(field)
    .isString()
    .withMessage(TripErrorMessages.VALIDATION.LOCATION_URL_INVALID)
    .isLength({ min: 1, max: 500 })
    .withMessage(TripErrorMessages.VALIDATION.LOCATION_URL_INVALID)
    .matches(/^https?:\/\//i)
    .withMessage(TripErrorMessages.VALIDATION.LOCATION_URL_INVALID)
    .trim();
  const c = required ? chain.notEmpty().withMessage(field === 'pickup_location_url' ? TripErrorMessages.VALIDATION.PICKUP_REQUIRED : TripErrorMessages.VALIDATION.DROPOFF_REQUIRED) : chain.optional();
  return [c];
};

/**
 * Middleware de validation pour la création d'un trajet/course.
 * Accepte soit (from, to) soit (pickup_location_url, dropoff_location_url). customer_phone optionnel.
 */
export const validateCreateTrip: ValidationChain[] = [
  body('from')
    .optional()
    .isString()
    .withMessage(TripErrorMessages.VALIDATION.FROM_REQUIRED)
    .isLength({ min: 1, max: 255 })
    .withMessage(TripErrorMessages.VALIDATION.FROM_TOO_LONG)
    .trim(),
  body('to')
    .optional()
    .isString()
    .withMessage(TripErrorMessages.VALIDATION.TO_REQUIRED)
    .isLength({ min: 1, max: 255 })
    .withMessage(TripErrorMessages.VALIDATION.TO_TOO_LONG)
    .trim(),
  ...locationUrlChain('pickup_location_url', false),
  ...locationUrlChain('dropoff_location_url', false),
  body()
    .custom((value, { req }) => {
      const hasFromTo = req.body?.from && req.body?.to;
      const hasPickupDropoff = req.body?.pickup_location_url && req.body?.dropoff_location_url;
      if (hasFromTo || hasPickupDropoff) return true;
      if (req.body?.pickup_location_url || req.body?.dropoff_location_url) {
        throw new Error('pickup_location_url et dropoff_location_url doivent être fournis ensemble');
      }
      throw new Error('Fournissez soit (from, to) soit (pickup_location_url, dropoff_location_url)');
    }),
  body('customer_phone')
    .optional({ values: 'falsy' })
    .isString()
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
