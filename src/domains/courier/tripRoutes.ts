import { Router } from 'express';
import {
  getAvailableTrips,
  claimTrip,
  getCourierTripById,
  getActiveCourierTrip,
  updateCourierLocationHandler,
  confirmPickup,
  confirmDelivery,
} from './controllers/availableTripsController';
import { validateAvailableTripsQuery } from './validators/availableTripsValidators';
import { validateLatLngBody } from './validators/courierActionValidators';
import { validateTripId } from '../trip/validators/tripValidators';
import { checkValidationErrors } from '../../middleware/validate';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { authenticateJWT } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/requireRole';

const router = Router();

/**
 * GET /courier/trips/available?lat=..&lng=..
 * Courses pending à proximité (haversine). Livreur uniquement.
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
 * GET /courier/trips/active — Course active du livreur (accepted/in_progress) ou null.
 * Doit être déclaré avant /trips/:id pour ne pas être capturé par le param.
 */
router.get(
  '/trips/active',
  authenticateJWT,
  requireRole('courier'),
  asyncHandler(getActiveCourierTrip)
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

/**
 * POST /courier/trips/:id/location — Mise à jour position GPS live.
 */
router.post(
  '/trips/:id/location',
  authenticateJWT,
  requireRole('courier'),
  validateTripId,
  validateLatLngBody,
  checkValidationErrors,
  asyncHandler(updateCourierLocationHandler)
);

/**
 * POST /courier/trips/:id/pickup — Confirme la réception (géofence 150 m).
 */
router.post(
  '/trips/:id/pickup',
  authenticateJWT,
  requireRole('courier'),
  validateTripId,
  validateLatLngBody,
  checkValidationErrors,
  asyncHandler(confirmPickup)
);

/**
 * POST /courier/trips/:id/deliver — Confirme la livraison + encaissement.
 */
router.post(
  '/trips/:id/deliver',
  authenticateJWT,
  requireRole('courier'),
  validateTripId,
  validateLatLngBody,
  checkValidationErrors,
  asyncHandler(confirmDelivery)
);

export default router;
