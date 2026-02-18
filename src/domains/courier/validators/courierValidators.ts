import { param, ValidationChain } from 'express-validator';
import { CourierErrorMessages } from '../constants/errorMessages';

/**
 * Middleware de validation pour l'ID d'un livreur (paramètre URL)
 */
export const validateCourierId: ValidationChain[] = [
  param('id')
    .notEmpty()
    .withMessage(CourierErrorMessages.VALIDATION.COURIER_ID_INVALID)
    .isUUID()
    .withMessage(CourierErrorMessages.VALIDATION.COURIER_ID_INVALID),
];
