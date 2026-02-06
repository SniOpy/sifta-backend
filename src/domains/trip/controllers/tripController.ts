import { Request, Response } from 'express';
import { tripService } from '../services/tripService';
import { successResponse } from '../../../shared/responses/apiResponse';
import { UnauthorizedError } from '../../../shared/errors/appError';
import { AuthErrorMessages } from '../../auth/constants/errorMessages';
import { CreateTripInput, TripFilters } from '../types';

/**
 * Contrôleur pour créer un nouveau trajet
 * Route protégée nécessitant un token JWT valide
 * 
 * @param req - Requête Express avec req.user injecté par authenticateJWT
 * @param res - Réponse Express
 */
export async function createTrip(
  req: Request,
  res: Response
): Promise<void> {
  if (!req.user) {
    throw new UnauthorizedError(AuthErrorMessages.USER.NOT_AUTHENTICATED);
  }

  const input: CreateTripInput = {
    from: req.body.from,
    to: req.body.to,
    price: req.body.price,
    currency: req.body.currency,
  };

  const trip = await tripService.createTrip(req.user.id, input);

  successResponse(
    res,
    { trip },
    'Trajet créé avec succès',
    201
  );
}

/**
 * Contrôleur pour obtenir les détails d'un trajet spécifique
 * Route protégée nécessitant un token JWT valide
 * 
 * @param req - Requête Express avec req.user injecté par authenticateJWT
 * @param res - Réponse Express
 */
export async function getTripById(
  req: Request,
  res: Response
): Promise<void> {
  if (!req.user) {
    throw new UnauthorizedError(AuthErrorMessages.USER.NOT_AUTHENTICATED);
  }

  const tripId = req.params.id;
  const trip = await tripService.getTripById(tripId, req.user.id);

  successResponse(
    res,
    { trip },
    'Trajet récupéré avec succès',
    200
  );
}

/**
 * Contrôleur pour obtenir la liste paginée des trajets de l'utilisateur
 * Route protégée nécessitant un token JWT valide
 * 
 * @param req - Requête Express avec req.user injecté par authenticateJWT
 * @param res - Réponse Express
 */
export async function getUserTrips(
  req: Request,
  res: Response
): Promise<void> {
  if (!req.user) {
    throw new UnauthorizedError(AuthErrorMessages.USER.NOT_AUTHENTICATED);
  }

  const filters: TripFilters = {
    page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
    limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
    status: req.query.status as any,
  };

  const result = await tripService.getUserTrips(req.user.id, filters);

  successResponse(
    res,
    result,
    'Trajets récupérés avec succès',
    200
  );
}

/**
 * Contrôleur pour annuler un trajet
 * Route protégée nécessitant un token JWT valide
 * 
 * @param req - Requête Express avec req.user injecté par authenticateJWT
 * @param res - Réponse Express
 */
export async function cancelTrip(
  req: Request,
  res: Response
): Promise<void> {
  if (!req.user) {
    throw new UnauthorizedError(AuthErrorMessages.USER.NOT_AUTHENTICATED);
  }

  const tripId = req.params.id;
  const trip = await tripService.cancelTrip(tripId, req.user.id);

  successResponse(
    res,
    { trip },
    'Trajet annulé avec succès',
    200
  );
}
