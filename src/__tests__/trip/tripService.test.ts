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
    const pickupUrl = 'https://www.google.com/maps?q=35.7595,-5.8340';
    const dropoffUrl = 'https://www.google.com/maps?q=35.7700,-5.8000';
    const pickupCoords = { lat: 35.7595, lng: -5.834 };
    const dropoffCoords = { lat: 35.77, lng: -5.8 };

    it('devrait créer un trajet avec les données fournies', async () => {
      const input = {
        from: pickupUrl,
        to: dropoffUrl,
        price: 150.50,
        currency: 'MAD',
        city: 'Tanger',
        customer_phone: '+212600000000',
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
        pickup_lat: pickupCoords.lat,
        pickup_lng: pickupCoords.lng,
        dropoff_lat: dropoffCoords.lat,
        dropoff_lng: dropoffCoords.lng,
        courier_id: null,
        assigned_at: null,
        city: 'Tanger',
        customer_phone: '+212600000000',
        delivery_fee: 20,
        sokhra_commission: 2,
        picked_up_at: null,
        delivered_at: null,
        cash_collected: false,
        courier_lat: null,
        courier_lng: null,
        courier_location_at: null,
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
        pickupCoords,
        dropoffCoords,
        'Tanger',
        '+212600000000',
        expect.any(Number),
        expect.any(Number)
      );
    });

    it('devrait rejeter une création sans montant (prix requis)', async () => {
      await expect(
        tripService.createTrip(testUserId, {
          from: pickupUrl,
          to: dropoffUrl,
          city: 'Tanger',
        } as never)
      ).rejects.toThrow(ValidationError);
      expect(mockCreateTrip).not.toHaveBeenCalled();
    });

    it('devrait rejeter une ville non desservie', async () => {
      await expect(
        tripService.createTrip(testUserId, { from: pickupUrl, to: dropoffUrl, city: 'Casablanca', price: 100 })
      ).rejects.toThrow(ValidationError);
      expect(mockCreateTrip).not.toHaveBeenCalled();
    });

    it('devrait rejeter un lien de prise en charge sans coordonnées', async () => {
      await expect(
        tripService.createTrip(testUserId, { from: 'https://maps.app.goo.gl/abc', to: dropoffUrl, city: 'Tanger', price: 100 })
      ).rejects.toThrow(ValidationError);
      expect(mockCreateTrip).not.toHaveBeenCalled();
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
        courier_id: null,
        assigned_at: null,
        city: null,
        customer_phone: null,
        delivery_fee: null,
        sokhra_commission: null,
        picked_up_at: null,
        delivered_at: null,
        cash_collected: false,
        courier_lat: null,
        courier_lng: null,
        courier_location_at: null,
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
        courier_id: null,
        assigned_at: null,
        city: null,
        customer_phone: null,
        delivery_fee: null,
        sokhra_commission: null,
        picked_up_at: null,
        delivered_at: null,
        cash_collected: false,
        courier_lat: null,
        courier_lng: null,
        courier_location_at: null,
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
        courier_id: null,
        assigned_at: null,
        city: null,
        customer_phone: null,
        delivery_fee: null,
        sokhra_commission: null,
        picked_up_at: null,
        delivered_at: null,
        cash_collected: false,
        courier_lat: null,
        courier_lng: null,
        courier_location_at: null,
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
        courier_id: null,
        assigned_at: null,
        city: null,
        customer_phone: null,
        delivery_fee: null,
        sokhra_commission: null,
        picked_up_at: null,
        delivered_at: null,
        cash_collected: false,
        courier_lat: null,
        courier_lng: null,
        courier_location_at: null,
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
        courier_id: null,
        assigned_at: null,
        city: null,
        customer_phone: null,
        delivery_fee: null,
        sokhra_commission: null,
        picked_up_at: null,
        delivered_at: null,
        cash_collected: false,
        courier_lat: null,
        courier_lng: null,
        courier_location_at: null,
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
        courier_id: null,
        assigned_at: null,
        city: null,
        customer_phone: null,
        delivery_fee: null,
        sokhra_commission: null,
        picked_up_at: null,
        delivered_at: null,
        cash_collected: false,
        courier_lat: null,
        courier_lng: null,
        courier_location_at: null,
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
        courier_id: null,
        assigned_at: null,
        city: null,
        customer_phone: null,
        delivery_fee: null,
        sokhra_commission: null,
        picked_up_at: null,
        delivered_at: null,
        cash_collected: false,
        courier_lat: null,
        courier_lng: null,
        courier_location_at: null,
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
        courier_id: null,
        assigned_at: null,
        city: null,
        customer_phone: null,
        delivery_fee: null,
        sokhra_commission: null,
        picked_up_at: null,
        delivered_at: null,
        cash_collected: false,
        courier_lat: null,
        courier_lng: null,
        courier_location_at: null,
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
        courier_id: null,
        assigned_at: null,
        city: null,
        customer_phone: null,
        delivery_fee: null,
        sokhra_commission: null,
        picked_up_at: null,
        delivered_at: null,
        cash_collected: false,
        courier_lat: null,
        courier_lng: null,
        courier_location_at: null,
      };

      mockFindTripById.mockResolvedValue(mockTrip);

      await expect(tripService.cancelTrip(tripId, testUserId)).rejects.toThrow(
        ValidationError
      );
    });
  });
});
