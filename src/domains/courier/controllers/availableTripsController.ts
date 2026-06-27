import { Request, Response } from 'express';
import {
  findTripsAvailableInBoundingBox,
  claimTripById,
  findTripById,
  markTripPickedUp,
  markTripDelivered,
  updateCourierLocation,
  findActiveTripByCourier,
} from '../../trip/models/tripModel';
import { incrementCommissionDue } from '../../course/models/courierAccountModel';
import { boundingBox, haversineKm } from '../../../shared/utils/geo';
import {
  computeDeliveryPricing,
  ETA_MIN_PER_KM,
  PICKUP_GEOFENCE_KM,
  PICKUP_GEOFENCE_ENABLED,
} from '../../../shared/pricing/deliveryPricing';
import { successResponse } from '../../../shared/responses/apiResponse';
import {
  UnauthorizedError,
  NotFoundError,
  ConflictError,
  ValidationError,
  ForbiddenError,
} from '../../../shared/errors/appError';
import { AuthErrorMessages } from '../../auth/constants/errorMessages';
import { TripErrorMessages } from '../../trip/constants/errorMessages';
import type { Trip, CourierAvailableTripResponse, CourierTripDetailResponse } from '../../trip/types';

// Phase test mono-ville (Tanger) : rayon large pour couvrir toute la ville
// quelle que soit la position du livreur. À réduire au déploiement multi-villes.
const RADIUS_KM = 30;

/**
 * Tarification d'une course : utilise les valeurs figées en base
 * (delivery_fee / sokhra_commission). Fallback de calcul pour les courses
 * antérieures à la migration (sans ces colonnes).
 */
function derivePricing(trip: Trip): {
  orderAmount: number;
  deliveryFee: number;
  commission: number;
  clientTotal: number;
} {
  const orderAmount = trip.price != null && trip.price > 0 ? Math.round(trip.price) : 0;

  if (trip.delivery_fee != null) {
    const deliveryFee = Math.round(trip.delivery_fee);
    const commission = Math.round(trip.sokhra_commission ?? 0);
    return {
      orderAmount,
      deliveryFee,
      commission,
      clientTotal: orderAmount + deliveryFee + commission,
    };
  }

  const distanceKm =
    trip.pickup_lat != null &&
    trip.pickup_lng != null &&
    trip.dropoff_lat != null &&
    trip.dropoff_lng != null
      ? haversineKm(
          { lat: trip.pickup_lat, lng: trip.pickup_lng },
          { lat: trip.dropoff_lat, lng: trip.dropoff_lng }
        )
      : 0;
  const pricing = computeDeliveryPricing(distanceKm, orderAmount);
  return {
    orderAmount,
    deliveryFee: pricing.deliveryFee,
    commission: pricing.commission,
    clientTotal: pricing.clientTotal,
  };
}

/**
 * Mappe un Trip vers le DTO de détail livreur (montants figés inclus).
 */
function mapCourierDetail(trip: Trip): CourierTripDetailResponse {
  const { orderAmount, deliveryFee, commission, clientTotal } = derivePricing(trip);
  return {
    id: trip.id,
    status: trip.status,
    pickup_url: trip.from_location,
    dropoff_url: trip.to_location,
    customer_phone: trip.customer_phone ?? null,
    order_amount: orderAmount,
    amount_total: clientTotal,
    delivery_fee: deliveryFee,
    commission,
    client_total: clientTotal,
    created_at: trip.created_at,
    pickup_lat: trip.pickup_lat ?? null,
    pickup_lng: trip.pickup_lng ?? null,
    dropoff_lat: trip.dropoff_lat ?? null,
    dropoff_lng: trip.dropoff_lng ?? null,
    picked_up_at: trip.picked_up_at ?? null,
    delivered_at: trip.delivered_at ?? null,
  };
}

/**
 * GET /courier/trips/available?lat=..&lng=..
 * Retourne les courses pending dans le rayon configuré du livreur.
 */
export async function getAvailableTrips(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new UnauthorizedError(AuthErrorMessages.USER.NOT_AUTHENTICATED);
  }

  const lat = parseFloat(req.query.lat as string);
  const lng = parseFloat(req.query.lng as string);
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    throw new ValidationError('Paramètres lat et lng requis et doivent être des nombres (ex. ?lat=33.57&lng=-7.58).');
  }

  const box = boundingBox(lat, lng, RADIUS_KM);
  const trips = await findTripsAvailableInBoundingBox(
    box.minLat,
    box.maxLat,
    box.minLng,
    box.maxLng
  );

  const courierPos = { lat, lng };
  const dtos: CourierAvailableTripResponse[] = [];

  for (const trip of trips) {
    const pickupLat = trip.pickup_lat;
    const pickupLng = trip.pickup_lng;
    if (pickupLat == null || pickupLng == null) continue;

    const distanceKmToPickup = haversineKm(courierPos, { lat: pickupLat, lng: pickupLng });
    if (distanceKmToPickup > RADIUS_KM) continue;

    const { orderAmount, deliveryFee, commission, clientTotal } = derivePricing(trip);

    dtos.push({
      id: trip.id,
      pickup_location_url: trip.from_location,
      dropoff_location_url: trip.to_location,
      distance_km_estimated: Math.round(distanceKmToPickup * 10) / 10,
      eta_minutes_estimated: Math.round(distanceKmToPickup * ETA_MIN_PER_KM),
      order_amount: orderAmount,
      amount_total: clientTotal,
      delivery_fee: deliveryFee,
      commission,
      client_total: clientTotal,
      pickup_lat: pickupLat,
      pickup_lng: pickupLng,
      dropoff_lat: trip.dropoff_lat ?? null,
      dropoff_lng: trip.dropoff_lng ?? null,
    });
  }

  successResponse(res, { trips: dtos }, 'Courses disponibles récupérées', 200);
}

/**
 * POST /courier/trips/:id/claim — Accepter (prendre) une course.
 * Refuse (409) si le livreur a déjà une course active (accepted/in_progress).
 */
export async function claimTrip(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new UnauthorizedError(AuthErrorMessages.USER.NOT_AUTHENTICATED);
  }

  // Une seule course active à la fois (conçu pour autoriser le multi plus tard).
  const active = await findActiveTripByCourier(req.user.id);
  if (active) {
    throw new ConflictError(TripErrorMessages.VALIDATION.HAS_ACTIVE_TRIP);
  }

  const tripId = req.params.id;
  const trip = await claimTripById(tripId, req.user.id);

  if (trip) {
    successResponse(res, { trip }, 'Course acceptée', 200);
    return;
  }

  const existing = await findTripById(tripId);
  if (!existing) {
    throw new NotFoundError(TripErrorMessages.TRIP.NOT_FOUND);
  }
  throw new ConflictError('Course déjà acceptée par un autre chauffeur.');
}

/**
 * GET /courier/trips/active — Course active du livreur (accepted/in_progress) ou null.
 */
export async function getActiveCourierTrip(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new UnauthorizedError(AuthErrorMessages.USER.NOT_AUTHENTICATED);
  }

  const active = await findActiveTripByCourier(req.user.id);
  successResponse(
    res,
    { trip: active ? mapCourierDetail(active) : null },
    'Course active récupérée',
    200
  );
}

/**
 * GET /courier/trips/:id — Détail d'une mission assignée au livreur.
 */
export async function getCourierTripById(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new UnauthorizedError(AuthErrorMessages.USER.NOT_AUTHENTICATED);
  }

  const tripId = req.params.id;
  const trip = await findTripById(tripId);
  if (!trip) {
    throw new NotFoundError(TripErrorMessages.TRIP.NOT_FOUND);
  }

  const isOwner = trip.courier_id === req.user.id;
  const isAdmin = req.user.is_admin === true;
  if (!isOwner && !isAdmin) {
    throw new ForbiddenError('Vous n\'êtes pas autorisé à accéder à cette mission.');
  }

  successResponse(res, { trip: mapCourierDetail(trip) }, 'Mission récupérée', 200);
}

/**
 * POST /courier/trips/:id/location { lat, lng } — Met à jour la position GPS live.
 */
export async function updateCourierLocationHandler(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new UnauthorizedError(AuthErrorMessages.USER.NOT_AUTHENTICATED);
  }

  const tripId = req.params.id;
  const lat = parseFloat(req.body.lat);
  const lng = parseFloat(req.body.lng);
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    throw new ValidationError(TripErrorMessages.VALIDATION.LAT_LNG_REQUIRED);
  }

  const updated = await updateCourierLocation(tripId, req.user.id, lat, lng);
  if (!updated) {
    // Soit course inexistante / pas la sienne, soit pas dans un état actif.
    const existing = await findTripById(tripId);
    if (!existing) throw new NotFoundError(TripErrorMessages.TRIP.NOT_FOUND);
    throw new ValidationError(TripErrorMessages.VALIDATION.INVALID_STATE);
  }

  successResponse(res, { trip: mapCourierDetail(updated) }, 'Position mise à jour', 200);
}

/**
 * POST /courier/trips/:id/pickup { lat, lng } — Confirme la réception (accepted -> in_progress).
 * Géofence : refuse (400) si le livreur est à plus de PICKUP_GEOFENCE_KM du pickup.
 */
export async function confirmPickup(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new UnauthorizedError(AuthErrorMessages.USER.NOT_AUTHENTICATED);
  }

  const tripId = req.params.id;
  const lat = parseFloat(req.body.lat);
  const lng = parseFloat(req.body.lng);
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    throw new ValidationError(TripErrorMessages.VALIDATION.LAT_LNG_REQUIRED);
  }

  const trip = await findTripById(tripId);
  if (!trip) {
    throw new NotFoundError(TripErrorMessages.TRIP.NOT_FOUND);
  }
  if (trip.courier_id !== req.user.id) {
    throw new ForbiddenError('Vous n\'êtes pas autorisé à accéder à cette mission.');
  }
  if (trip.status !== 'accepted') {
    throw new ValidationError(TripErrorMessages.VALIDATION.INVALID_STATE);
  }

  // Géofence : la position du livreur doit être proche du point de prise en charge.
  // TEMPORAIRE : désactivable via PICKUP_GEOFENCE_ENABLED pour la phase de test.
  if (PICKUP_GEOFENCE_ENABLED && trip.pickup_lat != null && trip.pickup_lng != null) {
    const distanceKm = haversineKm({ lat, lng }, { lat: trip.pickup_lat, lng: trip.pickup_lng });
    if (distanceKm > PICKUP_GEOFENCE_KM) {
      throw new ValidationError(TripErrorMessages.VALIDATION.TOO_FAR_FROM_PICKUP);
    }
  }

  // Met à jour la position puis bascule en in_progress.
  await updateCourierLocation(tripId, req.user.id, lat, lng);
  const updated = await markTripPickedUp(tripId, req.user.id);
  if (!updated) {
    throw new ValidationError(TripErrorMessages.VALIDATION.INVALID_STATE);
  }

  successResponse(res, { trip: mapCourierDetail(updated) }, 'Réception confirmée', 200);
}

/**
 * POST /courier/trips/:id/deliver { lat, lng } — Confirme livraison + encaissement
 * (in_progress -> completed) et crédite la commission due du livreur.
 */
export async function confirmDelivery(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new UnauthorizedError(AuthErrorMessages.USER.NOT_AUTHENTICATED);
  }

  const tripId = req.params.id;
  const lat = parseFloat(req.body.lat);
  const lng = parseFloat(req.body.lng);

  const trip = await findTripById(tripId);
  if (!trip) {
    throw new NotFoundError(TripErrorMessages.TRIP.NOT_FOUND);
  }
  if (trip.courier_id !== req.user.id) {
    throw new ForbiddenError('Vous n\'êtes pas autorisé à accéder à cette mission.');
  }
  if (trip.status !== 'in_progress') {
    throw new ValidationError(TripErrorMessages.VALIDATION.INVALID_STATE);
  }

  if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
    await updateCourierLocation(tripId, req.user.id, lat, lng);
  }

  const updated = await markTripDelivered(tripId, req.user.id);
  if (!updated) {
    throw new ValidationError(TripErrorMessages.VALIDATION.INVALID_STATE);
  }

  // Commission Sokhra due par le livreur (10% de F), figée à la création.
  const { commission } = derivePricing(updated);
  if (commission > 0) {
    await incrementCommissionDue(req.user.id, commission);
  }

  successResponse(res, { trip: mapCourierDetail(updated) }, 'Livraison confirmée', 200);
}
