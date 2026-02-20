import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { tripService } from '../../domains/trip/services/tripService';
import { NotFoundError, ForbiddenError, ValidationError } from '../../shared/errors/appError';
import {
  createTrip as createTripModel,
  findTripById,
  updateTripStatus,
  deleteTrip,
} from '../../domains/trip/models/tripModel';
import { createUser } from '../../domains/user/models/userModel';
import pool from '../../config/database';
import { TripStatus } from '../../domains/trip/types';

// Mock des modèles pour isoler les tests du service
jest.mock('../../domains/trip/models/tripModel');
jest.mock('../../domains/user/models/userModel');

const mockCreateTrip = createTripModel as jest.MockedFunction<typeof createTripModel>;
const mockFindTripById = findTripById as jest.MockedFunction<typeof findTripById>;
const mockUpdateTripStatus = updateTripStatus as jest.MockedFunction<typeof updateTripStatus>;

describe('TripService', () => {
  const testUserId = 'test-user-id';
  const otherUserId = 'other-user-id';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createTrip', () => {
    it('devrait créer un trajet avec les données fournies', async () => {
      const input = {
        from: 'Casablanca, Maroc',
        to: 'Rabat, Maroc',
        price: 150.50,
        currency: 'MAD',
      };

      const mockTrip = {
        id: 'trip-id',
        user_id: testUserId,
        from_location: input.from,
        to_location: input.to,
        status: 'pending' as TripStatus,
        price: input.price,
        currency: input.currency,
        payment_status: 'pending' as const,
        created_at: new Date(),
        updated_at: new Date(),
        pickup_lat: null,
        pickup_lng: null,
        dropoff_lat: null,
        dropoff_lng: null,
      };

      mockCreateTrip.mockResolvedValue(mockTrip);

      const result = await tripService.createTrip(testUserId, input);

      expect(result).toEqual(mockTrip);
      expect(mockCreateTrip).toHaveBeenCalledWith(
        testUserId,
        input.from,
        input.to,
        input.price,
        input.currency,
        null,
        null
      );
    });

    it('devrait créer un trajet sans prix si non fourni', async () => {
      const input = {
        from: 'Tanger, Maroc',
        to: 'Fès, Maroc',
      };

      const mockTrip = {
        id: 'trip-id',
        user_id: testUserId,
        from_location: input.from,
        to_location: input.to,
        status: 'pending' as TripStatus,
        price: null,
        currency: 'MAD',
        payment_status: 'pending' as const,
        created_at: new Date(),
        updated_at: new Date(),
        pickup_lat: null,
        pickup_lng: null,
        dropoff_lat: null,
        dropoff_lng: null,
      };

      mockCreateTrip.mockResolvedValue(mockTrip);

      const result = await tripService.createTrip(testUserId, input);

      expect(result.price).toBeNull();
      expect(mockCreateTrip).toHaveBeenCalledWith(
        testUserId,
        input.from,
        input.to,
        null,
        'MAD',
        null,
        null
      );
    });
  });

  describe('getTripById', () => {
    it('devrait retourner un trajet si l\'utilisateur est propriétaire', async () => {
      const tripId = 'trip-id';
      const mockTrip = {
        id: tripId,
        user_id: testUserId,
        from_location: 'Casablanca',
        to_location: 'Rabat',
        status: 'pending' as TripStatus,
        price: 150.50,
        currency: 'MAD',
        payment_status: 'pending' as const,
        created_at: new Date(),
        updated_at: new Date(),
        pickup_lat: null,
        pickup_lng: null,
        dropoff_lat: null,
        dropoff_lng: null,
      };

      mockFindTripById.mockResolvedValue(mockTrip);

      const result = await tripService.getTripById(tripId, testUserId);

      expect(result).toEqual(mockTrip);
      expect(mockFindTripById).toHaveBeenCalledWith(tripId);
    });

    it('devrait lancer NotFoundError si le trajet n\'existe pas', async () => {
      mockFindTripById.mockResolvedValue(null);

      await expect(tripService.getTripById('non-existent-id', testUserId)).rejects.toThrow(
        NotFoundError
      );
    });

    it('devrait lancer ForbiddenError si l\'utilisateur n\'est pas propriétaire', async () => {
      const tripId = 'trip-id';
      const mockTrip = {
        id: tripId,
        user_id: otherUserId, // Autre utilisateur
        from_location: 'Casablanca',
        to_location: 'Rabat',
        status: 'pending' as TripStatus,
        price: 150.50,
        currency: 'MAD',
        payment_status: 'pending' as const,
        created_at: new Date(),
        updated_at: new Date(),
        pickup_lat: null,
        pickup_lng: null,
        dropoff_lat: null,
        dropoff_lng: null,
      };

      mockFindTripById.mockResolvedValue(mockTrip);

      await expect(tripService.getTripById(tripId, testUserId)).rejects.toThrow(
        ForbiddenError
      );
    });
  });

  describe('updateTripStatus', () => {
    it('devrait mettre à jour le statut si la transition est valide', async () => {
      const tripId = 'trip-id';
      const mockTrip = {
        id: tripId,
        user_id: testUserId,
        from_location: 'Casablanca',
        to_location: 'Rabat',
        status: 'pending' as TripStatus,
        price: 150.50,
        currency: 'MAD',
        payment_status: 'pending' as const,
        created_at: new Date(),
        updated_at: new Date(),
        pickup_lat: null,
        pickup_lng: null,
        dropoff_lat: null,
        dropoff_lng: null,
      };

      const updatedTrip = {
        ...mockTrip,
        status: 'accepted' as TripStatus,
      };

      mockFindTripById.mockResolvedValue(mockTrip);
      mockUpdateTripStatus.mockResolvedValue(updatedTrip);

      const result = await tripService.updateTripStatus(tripId, testUserId, 'accepted');

      expect(result.status).toBe('accepted');
      expect(mockUpdateTripStatus).toHaveBeenCalledWith(tripId, 'accepted');
    });

    it('devrait rejeter une transition invalide', async () => {
      const tripId = 'trip-id';
      const mockTrip = {
        id: tripId,
        user_id: testUserId,
        from_location: 'Casablanca',
        to_location: 'Rabat',
        status: 'pending' as TripStatus,
        price: 150.50,
        currency: 'MAD',
        payment_status: 'pending' as const,
        created_at: new Date(),
        updated_at: new Date(),
        pickup_lat: null,
        pickup_lng: null,
        dropoff_lat: null,
        dropoff_lng: null,
      };

      mockFindTripById.mockResolvedValue(mockTrip);

      await expect(
        tripService.updateTripStatus(tripId, testUserId, 'completed')
      ).rejects.toThrow(ValidationError);
    });

    it('devrait rejeter une modification d\'un trajet completed', async () => {
      const tripId = 'trip-id';
      const mockTrip = {
        id: tripId,
        user_id: testUserId,
        from_location: 'Casablanca',
        to_location: 'Rabat',
        status: 'completed' as TripStatus,
        price: 150.50,
        currency: 'MAD',
        payment_status: 'paid' as const,
        created_at: new Date(),
        updated_at: new Date(),
        pickup_lat: null,
        pickup_lng: null,
        dropoff_lat: null,
        dropoff_lng: null,
      };

      mockFindTripById.mockResolvedValue(mockTrip);

      await expect(
        tripService.updateTripStatus(tripId, testUserId, 'pending')
      ).rejects.toThrow(ValidationError);
    });

    it('devrait rejeter une modification d\'un trajet cancelled', async () => {
      const tripId = 'trip-id';
      const mockTrip = {
        id: tripId,
        user_id: testUserId,
        from_location: 'Casablanca',
        to_location: 'Rabat',
        status: 'cancelled' as TripStatus,
        price: 150.50,
        currency: 'MAD',
        payment_status: 'pending' as const,
        created_at: new Date(),
        updated_at: new Date(),
        pickup_lat: null,
        pickup_lng: null,
        dropoff_lat: null,
        dropoff_lng: null,
      };

      mockFindTripById.mockResolvedValue(mockTrip);

      await expect(
        tripService.updateTripStatus(tripId, testUserId, 'pending')
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('cancelTrip', () => {
    it('devrait annuler un trajet pending', async () => {
      const tripId = 'trip-id';
      const mockTrip = {
        id: tripId,
        user_id: testUserId,
        from_location: 'Casablanca',
        to_location: 'Rabat',
        status: 'pending' as TripStatus,
        price: 150.50,
        currency: 'MAD',
        payment_status: 'pending' as const,
        created_at: new Date(),
        updated_at: new Date(),
        pickup_lat: null,
        pickup_lng: null,
        dropoff_lat: null,
        dropoff_lng: null,
      };

      const cancelledTrip = {
        ...mockTrip,
        status: 'cancelled' as TripStatus,
      };

      mockFindTripById.mockResolvedValue(mockTrip);
      mockUpdateTripStatus.mockResolvedValue(cancelledTrip);

      const result = await tripService.cancelTrip(tripId, testUserId);

      expect(result.status).toBe('cancelled');
      expect(mockUpdateTripStatus).toHaveBeenCalledWith(tripId, 'cancelled');
    });

    it('devrait rejeter l\'annulation d\'un trajet déjà completed', async () => {
      const tripId = 'trip-id';
      const mockTrip = {
        id: tripId,
        user_id: testUserId,
        from_location: 'Casablanca',
        to_location: 'Rabat',
        status: 'completed' as TripStatus,
        price: 150.50,
        currency: 'MAD',
        payment_status: 'paid' as const,
        created_at: new Date(),
        updated_at: new Date(),
        pickup_lat: null,
        pickup_lng: null,
        dropoff_lat: null,
        dropoff_lng: null,
      };

      mockFindTripById.mockResolvedValue(mockTrip);

      await expect(tripService.cancelTrip(tripId, testUserId)).rejects.toThrow(
        ValidationError
      );
    });

    it('devrait rejeter l\'annulation d\'un trajet déjà cancelled', async () => {
      const tripId = 'trip-id';
      const mockTrip = {
        id: tripId,
        user_id: testUserId,
        from_location: 'Casablanca',
        to_location: 'Rabat',
        status: 'cancelled' as TripStatus,
        price: 150.50,
        currency: 'MAD',
        payment_status: 'pending' as const,
        created_at: new Date(),
        updated_at: new Date(),
        pickup_lat: null,
        pickup_lng: null,
        dropoff_lat: null,
        dropoff_lng: null,
      };

      mockFindTripById.mockResolvedValue(mockTrip);

      await expect(tripService.cancelTrip(tripId, testUserId)).rejects.toThrow(
        ValidationError
      );
    });
  });
});
