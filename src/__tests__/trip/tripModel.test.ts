import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import {
  createTrip,
  findTripById,
  findTripsByUserId,
  updateTripStatus,
  deleteTrip,
} from '../../domains/trip/models/tripModel';
import { createUser } from '../../domains/user/models/userModel';
import pool from '../../config/database';

describe('TripModel', () => {
  let testUserId: string;
  let testTripId: string;

  beforeEach(async () => {
    // Nettoyer les données de test
    await pool.query('DELETE FROM trips WHERE user_id IN (SELECT id FROM users WHERE phone LIKE $1)', ['+2613%']);
    await pool.query('DELETE FROM users WHERE phone LIKE $1', ['+2613%']);

    // Créer un utilisateur de test
    const user = await createUser('+261341234567');
    testUserId = user.id;
  });

  afterEach(async () => {
    // Nettoyer après chaque test
    if (testTripId) {
      await deleteTrip(testTripId);
    }
    await pool.query('DELETE FROM trips WHERE user_id = $1', [testUserId]);
    await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
  });

  describe('createTrip', () => {
    it('devrait créer un trajet avec tous les champs', async () => {
      const trip = await createTrip(
        testUserId,
        'Casablanca, Maroc',
        'Rabat, Maroc',
        150.50,
        'MAD'
      );

      expect(trip).toBeDefined();
      expect(trip.id).toBeDefined();
      expect(trip.user_id).toBe(testUserId);
      expect(trip.from_location).toBe('Casablanca, Maroc');
      expect(trip.to_location).toBe('Rabat, Maroc');
      expect(trip.status).toBe('pending');
      expect(trip.price).toBe(150.50);
      expect(trip.currency).toBe('MAD');
      expect(trip.payment_status).toBe('pending');
      expect(trip.created_at).toBeInstanceOf(Date);
      expect(trip.updated_at).toBeInstanceOf(Date);

      testTripId = trip.id;
    });

    it('devrait créer un trajet sans prix', async () => {
      const trip = await createTrip(
        testUserId,
        'Tanger, Maroc',
        'Fès, Maroc'
      );

      expect(trip.price).toBeNull();
      expect(trip.currency).toBe('MAD'); // Défaut
      testTripId = trip.id;
    });
  });

  describe('findTripById', () => {
    it('devrait trouver un trajet par son ID', async () => {
      const createdTrip = await createTrip(
        testUserId,
        'Casablanca, Maroc',
        'Rabat, Maroc'
      );
      testTripId = createdTrip.id;

      const trip = await findTripById(createdTrip.id);

      expect(trip).toBeDefined();
      expect(trip?.id).toBe(createdTrip.id);
      expect(trip?.user_id).toBe(testUserId);
    });

    it('devrait retourner null si le trajet n\'existe pas', async () => {
      const trip = await findTripById('00000000-0000-0000-0000-000000000000');
      expect(trip).toBeNull();
    });
  });

  describe('findTripsByUserId', () => {
    it('devrait retourner tous les trajets d\'un utilisateur', async () => {
      // Créer plusieurs trajets
      const trip1 = await createTrip(testUserId, 'Casablanca', 'Rabat');
      const trip2 = await createTrip(testUserId, 'Tanger', 'Fès');
      testTripId = trip1.id;

      const result = await findTripsByUserId(testUserId);

      expect(result.trips.length).toBeGreaterThanOrEqual(2);
      expect(result.total).toBeGreaterThanOrEqual(2);
      const tripIds = result.trips.map(t => t.id);
      expect(tripIds).toContain(trip1.id);
      expect(tripIds).toContain(trip2.id);
    });

    it('devrait filtrer par statut', async () => {
      const trip1 = await createTrip(testUserId, 'Casablanca', 'Rabat');
      testTripId = trip1.id;
      
      // Mettre à jour le statut d'un trajet
      await updateTripStatus(trip1.id, 'accepted');

      const result = await findTripsByUserId(testUserId, { status: 'accepted' });

      expect(result.trips.every(t => t.status === 'accepted')).toBe(true);
    });

    it('devrait paginer les résultats', async () => {
      // Créer plusieurs trajets
      for (let i = 0; i < 5; i++) {
        await createTrip(testUserId, `From ${i}`, `To ${i}`);
      }

      const result = await findTripsByUserId(testUserId, { page: 1, limit: 2 });

      expect(result.trips.length).toBeLessThanOrEqual(2);
      expect(result.total).toBeGreaterThanOrEqual(5);
    });
  });

  describe('updateTripStatus', () => {
    it('devrait mettre à jour le statut d\'un trajet', async () => {
      const trip = await createTrip(testUserId, 'Casablanca', 'Rabat');
      testTripId = trip.id;

      const updatedTrip = await updateTripStatus(trip.id, 'accepted');

      expect(updatedTrip.status).toBe('accepted');
      expect(updatedTrip.id).toBe(trip.id);
    });
  });
});
