import { body, ValidationChain } from 'express-validator';

/**
 * Validation pour PATCH /users/me (mise à jour du type de compte)
 */
export const validatePatchAccountType: ValidationChain[] = [
  body('account_type')
    .notEmpty()
    .withMessage('account_type est requis')
    .isIn(['seller', 'courier'])
    .withMessage('account_type doit être "seller" ou "courier"'),
];
