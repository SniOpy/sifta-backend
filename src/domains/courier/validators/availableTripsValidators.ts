import { query, ValidationChain } from 'express-validator';
import { CourierErrorMessages } from '../constants/errorMessages';

/**
 * Validation pour GET /courier/trips/available?lat=..&lng=..
 */
export const validateAvailableTripsQuery: ValidationChain[] = [
  query('lat')
    .notEmpty()
    .withMessage(CourierErrorMessages.VALIDATION.LAT_REQUIRED)
    .isFloat({ min: -90, max: 90 })
    .withMessage(CourierErrorMessages.VALIDATION.LAT_INVALID)
    .toFloat(),
  query('lng')
    .notEmpty()
    .withMessage(CourierErrorMessages.VALIDATION.LNG_REQUIRED)
    .isFloat({ min: -180, max: 180 })
    .withMessage(CourierErrorMessages.VALIDATION.LNG_INVALID)
    .toFloat(),
];
