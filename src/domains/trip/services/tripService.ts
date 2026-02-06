import {
  createTrip as createTripModel,
  findTripById,
  findTripsByUserId,
  updateTripStatus,
} from '../models/tripModel';
import {
  Trip,
  CreateTripInput,
  TripFilters,
  PaginatedTripsResult,
  TripStatus,
} from '../types';
import { NotFoundError, ForbiddenError, ValidationError } from '../../../shared/errors/appError';
import { TripErrorMessages } from '../constants/errorMessages';
import { canTransition } from '../constants/tripStatus';

/**
 * Service métier pour la gestion des trajets
 */
export class TripService {
  /**
   * Crée un nouveau trajet pour un utilisateur
   * @param userId - ID de l'utilisateur
   * @param input - Données du trajet à créer
   * @returns Le trajet créé avec statut 'pending'
   */
  async createTrip(userId: string, input: CreateTripInput): Promise<Trip> {
    const trip = await createTripModel(
      userId,
      input.from,
      input.to,
      input.price ?? null,
      input.currency ?? 'MAD'
    );

    return trip;
  }

  /**
   * Récupère un trajet par son ID et vérifie que l'utilisateur est propriétaire
   * @param tripId - ID du trajet
   * @param userId - ID de l'utilisateur authentifié
   * @returns Le trajet trouvé
   * @throws NotFoundError si le trajet n'existe pas
   * @throws ForbiddenError si l'utilisateur n'est pas propriétaire
   */
  async getTripById(tripId: string, userId: string): Promise<Trip> {
    const trip = await findTripById(tripId);

    if (!trip) {
      throw new NotFoundError(TripErrorMessages.TRIP.NOT_FOUND);
    }

    // Vérifier que l'utilisateur est propriétaire du trajet
    if (trip.user_id !== userId) {
      throw new ForbiddenError(TripErrorMessages.TRIP.NOT_OWNER);
    }

    return trip;
  }

  /**
   * Récupère la liste paginée des trajets d'un utilisateur
   * @param userId - ID de l'utilisateur
   * @param filters - Filtres optionnels (status, page, limit)
   * @returns Liste paginée des trajets
   */
  async getUserTrips(
    userId: string,
    filters: TripFilters = {}
  ): Promise<PaginatedTripsResult> {
    const { trips, total } = await findTripsByUserId(userId, filters);

    return {
      trips,
      total,
      page: filters.page ?? 1,
      limit: filters.limit ?? 10,
    };
  }

  /**
   * Met à jour le statut d'un trajet avec validation stricte des transitions
   * @param tripId - ID du trajet
   * @param userId - ID de l'utilisateur authentifié
   * @param newStatus - Nouveau statut
   * @returns Le trajet mis à jour
   * @throws NotFoundError si le trajet n'existe pas
   * @throws ForbiddenError si l'utilisateur n'est pas propriétaire
   * @throws ValidationError si la transition n'est pas autorisée
   */
  async updateTripStatus(
    tripId: string,
    userId: string,
    newStatus: TripStatus
  ): Promise<Trip> {
    // Récupérer le trajet et vérifier la propriété
    const trip = await this.getTripById(tripId, userId);

    // Validation métier stricte : un trajet completed ne peut pas être modifié
    if (trip.status === 'completed') {
      throw new ValidationError(TripErrorMessages.TRIP.CANNOT_MODIFY_COMPLETED);
    }

    // Validation métier stricte : un trajet cancelled ne peut pas être modifié
    if (trip.status === 'cancelled') {
      throw new ValidationError(TripErrorMessages.TRIP.CANNOT_MODIFY_CANCELLED);
    }

    // Vérifier que la transition est autorisée
    if (!canTransition(trip.status, newStatus)) {
      throw new ValidationError(
        TripErrorMessages.TRIP.INVALID_TRANSITION(trip.status, newStatus)
      );
    }

    // Mettre à jour le statut en base
    const updatedTrip = await updateTripStatus(tripId, newStatus);

    return updatedTrip;
  }

  /**
   * Annule un trajet (met le statut à 'cancelled')
   * @param tripId - ID du trajet
   * @param userId - ID de l'utilisateur authentifié
   * @returns Le trajet annulé
   * @throws NotFoundError si le trajet n'existe pas
   * @throws ForbiddenError si l'utilisateur n'est pas propriétaire
   * @throws ValidationError si le trajet ne peut pas être annulé
   */
  async cancelTrip(tripId: string, userId: string): Promise<Trip> {
    // Récupérer le trajet et vérifier la propriété
    const trip = await this.getTripById(tripId, userId);

    // Validation spécifique : ne peut pas annuler si déjà completed ou cancelled
    if (trip.status === 'completed') {
      throw new ValidationError(TripErrorMessages.TRIP.CANNOT_CANCEL);
    }

    if (trip.status === 'cancelled') {
      throw new ValidationError(TripErrorMessages.TRIP.CANNOT_CANCEL);
    }

    // Utiliser updateTripStatus qui valide déjà les transitions
    return this.updateTripStatus(tripId, userId, 'cancelled');
  }
}

// Instance singleton du service
export const tripService = new TripService();
