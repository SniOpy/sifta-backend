import { Router } from 'express';
import {
  getCourierAccount,
  getMyCourierAccount,
  settleCourierAccount,
  settleMyCourierAccount,
} from './controllers/courierController';
import { validateCourierId } from './validators/courierValidators';
import { checkValidationErrors } from '../../middleware/validate';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { authenticateJWT } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/requireRole';
import { requireAdmin } from '../../middleware/authorizeAdmin';

const router = Router();

/** GET /couriers/me/account — livreur uniquement (ses propres infos). */
router.get(
  '/me/account',
  authenticateJWT,
  requireRole('courier'),
  asyncHandler(getMyCourierAccount)
);

/** POST /couriers/me/settle — admin uniquement (règle son propre compte courier). */
router.post(
  '/me/settle',
  authenticateJWT,
  requireAdmin,
  asyncHandler(settleMyCourierAccount)
);

/** GET /couriers/:id/account — livreur lui-même ou admin. */
router.get(
  '/:id/account',
  authenticateJWT,
  validateCourierId,
  checkValidationErrors,
  asyncHandler(getCourierAccount)
);

/** POST /couriers/:id/settle — admin only. */
router.post(
  '/:id/settle',
  authenticateJWT,
  requireAdmin,
  validateCourierId,
  checkValidationErrors,
  asyncHandler(settleCourierAccount)
);

export default router;
