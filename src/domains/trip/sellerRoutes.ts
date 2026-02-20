import { Router } from 'express';
import { getSellerTripById } from './controllers/sellerTripController';
import { validateTripId } from './validators/tripValidators';
import { checkValidationErrors } from '../../middleware/validate';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { authenticateJWT } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/requireRole';

const router = Router();

/**
 * GET /seller/trips/:id
 * Détail d'une course pour le vendeur (ownership + rôle seller).
 * 401 / 403 / 404 gérés par auth, requireRole et tripService.getTripById.
 */
router.get(
  '/:id',
  authenticateJWT,
  requireRole('seller'),
  validateTripId,
  checkValidationErrors,
  asyncHandler(getSellerTripById)
);

export default router;
