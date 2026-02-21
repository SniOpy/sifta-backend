import { Router } from 'express';
import {
  getAvailableTrips,
  claimTrip,
  getCourierTripById,
} from './controllers/availableTripsController';
import { validateAvailableTripsQuery } from './validators/availableTripsValidators';
import { validateTripId } from '../trip/validators/tripValidators';
import { checkValidationErrors } from '../../middleware/validate';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { authenticateJWT } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/requireRole';

const router = Router();

/**
 * GET /courier/trips/available?lat=..&lng=..
 * Courses WAITING à moins de 3 km (haversine). Livreur uniquement.
 */
router.get(
  '/trips/available',
  authenticateJWT,
  requireRole('courier'),
  validateAvailableTripsQuery,
  checkValidationErrors,
  asyncHandler(getAvailableTrips)
);

/**
 * GET /courier/trips/:id — Détail mission assignée (livreur propriétaire ou admin).
 */
router.get(
  '/trips/:id',
  authenticateJWT,
  requireRole('courier'),
  validateTripId,
  checkValidationErrors,
  asyncHandler(getCourierTripById)
);

/**
 * POST /courier/trips/:id/claim — Accepter la course (livreur uniquement).
 */
router.post(
  '/trips/:id/claim',
  authenticateJWT,
  requireRole('courier'),
  validateTripId,
  checkValidationErrors,
  asyncHandler(claimTrip)
);

export default router;
