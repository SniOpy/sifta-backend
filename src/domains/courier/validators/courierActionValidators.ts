import { body, ValidationChain } from 'express-validator';
import { CourierErrorMessages } from '../constants/errorMessages';

/**
 * Validation lat/lng dans le corps de requête (position du livreur).
 */
export const validateLatLngBody: ValidationChain[] = [
  body('lat')
    .notEmpty()
    .withMessage(CourierErrorMessages.VALIDATION.LAT_REQUIRED)
    .isFloat({ min: -90, max: 90 })
    .withMessage(CourierErrorMessages.VALIDATION.LAT_INVALID)
    .toFloat(),
  body('lng')
    .notEmpty()
    .withMessage(CourierErrorMessages.VALIDATION.LNG_REQUIRED)
    .isFloat({ min: -180, max: 180 })
    .withMessage(CourierErrorMessages.VALIDATION.LNG_INVALID)
    .toFloat(),
];
