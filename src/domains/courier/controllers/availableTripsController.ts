import { Request, Response } from 'express';
import {
  findTripsAvailableInBoundingBox,
  claimTripById,
  findTripById,
} from '../../trip/models/tripModel';
import { boundingBox, haversineKm } from '../../../shared/utils/geo';
import { successResponse } from '../../../shared/responses/apiResponse';
import { UnauthorizedError, NotFoundError, ConflictError, ValidationError, ForbiddenError } from '../../../shared/errors/appError';
import { AuthErrorMessages } from '../../auth/constants/errorMessages';
import { TripErrorMessages } from '../../trip/constants/errorMessages';
import type { CourierAvailableTripResponse, CourierTripDetailResponse } from '../../trip/types';

const RADIUS_KM = 3;
/** Minutes par km (estimation trajet livreur → pickup) */
const ETA_MIN_PER_KM = 2;
/** Pricing MVP: MAD par km si pas de prix stocké */
const AMOUNT_PER_KM = 5;
const MIN_AMOUNT_TOTAL = 20;
const DELIVERY_FEE_RATIO = 0.2;
const MIN_DELIVERY_FEE = 8;

/**
 * GET /courier/trips/available?lat=..&lng=..
 * Retourne les courses WAITING (pending) à moins de 3 km du livreur.
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

    const distancePickupDropoffKm =
      trip.dropoff_lat != null && trip.dropoff_lng != null
        ? haversineKm(
            { lat: pickupLat, lng: pickupLng },
            { lat: trip.dropoff_lat, lng: trip.dropoff_lng }
          )
        : 0;

    const amountTotal =
      trip.price != null && trip.price > 0
        ? Math.round(trip.price)
        : Math.max(MIN_AMOUNT_TOTAL, Math.round(distancePickupDropoffKm * AMOUNT_PER_KM));
    const deliveryFee = Math.max(
      MIN_DELIVERY_FEE,
      Math.round(amountTotal * DELIVERY_FEE_RATIO)
    );

    dtos.push({
      id: trip.id,
      pickup_location_url: trip.from_location,
      dropoff_location_url: trip.to_location,
      distance_km_estimated: Math.round(distanceKmToPickup * 10) / 10,
      eta_minutes_estimated: Math.round(distanceKmToPickup * ETA_MIN_PER_KM),
      amount_total: amountTotal,
      delivery_fee: deliveryFee,
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
 * 200 + trip si succès ; 404 si trip inexistant ; 409 si déjà prise par un autre.
 */
export async function claimTrip(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new UnauthorizedError(AuthErrorMessages.USER.NOT_AUTHENTICATED);
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
 * GET /courier/trips/:id — Détail d'une mission assignée au livreur.
 * 200 si courier_id === req.user.id ou admin ; 403 sinon ; 404 si trip absent.
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

  const pickupLat = trip.pickup_lat;
  const pickupLng = trip.pickup_lng;
  const distancePickupDropoffKm =
    trip.dropoff_lat != null && trip.dropoff_lng != null && pickupLat != null && pickupLng != null
      ? haversineKm(
          { lat: pickupLat, lng: pickupLng },
          { lat: trip.dropoff_lat, lng: trip.dropoff_lng }
        )
      : 0;

  const amountTotal =
    trip.price != null && trip.price > 0
      ? Math.round(trip.price)
      : Math.max(MIN_AMOUNT_TOTAL, Math.round(distancePickupDropoffKm * AMOUNT_PER_KM));
  const deliveryFee = Math.max(
    MIN_DELIVERY_FEE,
    Math.round(amountTotal * DELIVERY_FEE_RATIO)
  );

  const dto: CourierTripDetailResponse = {
    id: trip.id,
    status: trip.status,
    pickup_url: trip.from_location,
    dropoff_url: trip.to_location,
    customer_phone: null,
    amount_total: amountTotal,
    delivery_fee: deliveryFee,
    created_at: trip.created_at,
    pickup_lat: trip.pickup_lat ?? null,
    pickup_lng: trip.pickup_lng ?? null,
    dropoff_lat: trip.dropoff_lat ?? null,
    dropoff_lng: trip.dropoff_lng ?? null,
  };

  successResponse(res, { trip: dto }, 'Mission récupérée', 200);
}
