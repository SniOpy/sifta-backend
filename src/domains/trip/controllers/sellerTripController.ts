import { Request, Response } from 'express';
import { tripService } from '../services/tripService';
import { successResponse } from '../../../shared/responses/apiResponse';
import { UnauthorizedError } from '../../../shared/errors/appError';
import { AuthErrorMessages } from '../../auth/constants/errorMessages';
import type { SellerTripDetailResponse } from '../types';

/**
 * Mappe le modèle Trip vers le DTO vendeur (GET /seller/trips/:id).
 */
function mapTripToSellerDetail(trip: {
  id: string;
  status: string;
  from_location: string;
  to_location: string;
  price: number | null;
  created_at: Date;
  pickup_lat?: number | null;
  pickup_lng?: number | null;
  dropoff_lat?: number | null;
  dropoff_lng?: number | null;
}): SellerTripDetailResponse {
  return {
    id: trip.id,
    status: trip.status as SellerTripDetailResponse['status'],
    courier_id: null,
    pickup_url: trip.from_location,
    dropoff_url: trip.to_location,
    customer_phone: null,
    amount_total: trip.price,
    delivery_fee: null,
    created_at: trip.created_at,
    pickup_lat: trip.pickup_lat ?? null,
    pickup_lng: trip.pickup_lng ?? null,
    dropoff_lat: trip.dropoff_lat ?? null,
    dropoff_lng: trip.dropoff_lng ?? null,
  };
}

/**
 * GET /seller/trips/:id — Détail d'une course pour le vendeur.
 * 401 si non authentifié, 403 si pas seller ou pas propriétaire, 404 si trip absent.
 */
export async function getSellerTripById(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new UnauthorizedError(AuthErrorMessages.USER.NOT_AUTHENTICATED);
  }

  const tripId = req.params.id;
  const trip = await tripService.getTripById(tripId, req.user.id);
  const dto = mapTripToSellerDetail(trip);

  successResponse(res, { trip: dto }, 'Trajet récupéré avec succès', 200);
}
