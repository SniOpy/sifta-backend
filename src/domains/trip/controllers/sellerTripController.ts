import { Request, Response } from 'express';
import { tripService } from '../services/tripService';
import { successResponse } from '../../../shared/responses/apiResponse';
import { UnauthorizedError } from '../../../shared/errors/appError';
import { AuthErrorMessages } from '../../auth/constants/errorMessages';
import type { SellerTripDetailResponse, Trip } from '../types';

/**
 * Mappe le modèle Trip vers le DTO vendeur (GET /seller/trips/:id).
 */
function mapTripToSellerDetail(trip: Trip): SellerTripDetailResponse {
  const orderAmount = trip.price;
  const deliveryFee = trip.delivery_fee;
  const commission = trip.sokhra_commission;
  const clientTotal =
    orderAmount != null && deliveryFee != null
      ? orderAmount + deliveryFee + (commission ?? 0)
      : null;

  return {
    id: trip.id,
    status: trip.status as SellerTripDetailResponse['status'],
    courier_id: trip.courier_id ?? null,
    pickup_url: trip.from_location,
    dropoff_url: trip.to_location,
    customer_phone: trip.customer_phone ?? null,
    order_amount: orderAmount,
    amount_total: orderAmount,
    delivery_fee: deliveryFee,
    commission,
    client_total: clientTotal,
    created_at: trip.created_at,
    pickup_lat: trip.pickup_lat ?? null,
    pickup_lng: trip.pickup_lng ?? null,
    dropoff_lat: trip.dropoff_lat ?? null,
    dropoff_lng: trip.dropoff_lng ?? null,
    courier_lat: trip.courier_lat ?? null,
    courier_lng: trip.courier_lng ?? null,
    courier_location_at: trip.courier_location_at ?? null,
    picked_up_at: trip.picked_up_at ?? null,
    delivered_at: trip.delivered_at ?? null,
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
