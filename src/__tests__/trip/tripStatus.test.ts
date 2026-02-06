import { describe, it, expect } from '@jest/globals';
import {
  TRIP_STATUSES,
  TRIP_STATUS_TRANSITIONS,
  isValidTransition,
  canTransition,
  isValidStatus,
} from '../../domains/trip/constants/tripStatus';
import { TripStatus } from '../../domains/trip/types';

describe('Trip Status Constants', () => {
  describe('TRIP_STATUSES', () => {
    it('devrait contenir tous les statuts autorisés', () => {
      expect(TRIP_STATUSES).toHaveLength(5);
      expect(TRIP_STATUSES).toContain('pending');
      expect(TRIP_STATUSES).toContain('accepted');
      expect(TRIP_STATUSES).toContain('in_progress');
      expect(TRIP_STATUSES).toContain('completed');
      expect(TRIP_STATUSES).toContain('cancelled');
    });
  });

  describe('TRIP_STATUS_TRANSITIONS', () => {
    it('devrait définir les transitions autorisées pour pending', () => {
      expect(TRIP_STATUS_TRANSITIONS.pending).toEqual(['accepted', 'cancelled']);
    });

    it('devrait définir les transitions autorisées pour accepted', () => {
      expect(TRIP_STATUS_TRANSITIONS.accepted).toEqual(['in_progress', 'cancelled']);
    });

    it('devrait définir les transitions autorisées pour in_progress', () => {
      expect(TRIP_STATUS_TRANSITIONS.in_progress).toEqual(['completed', 'cancelled']);
    });

    it('devrait ne pas permettre de transitions depuis completed', () => {
      expect(TRIP_STATUS_TRANSITIONS.completed).toEqual([]);
    });

    it('devrait ne pas permettre de transitions depuis cancelled', () => {
      expect(TRIP_STATUS_TRANSITIONS.cancelled).toEqual([]);
    });
  });

  describe('isValidTransition', () => {
    it('devrait accepter une transition valide pending -> accepted', () => {
      expect(isValidTransition('pending', 'accepted')).toBe(true);
    });

    it('devrait accepter une transition valide pending -> cancelled', () => {
      expect(isValidTransition('pending', 'cancelled')).toBe(true);
    });

    it('devrait accepter une transition valide accepted -> in_progress', () => {
      expect(isValidTransition('accepted', 'in_progress')).toBe(true);
    });

    it('devrait accepter une transition valide in_progress -> completed', () => {
      expect(isValidTransition('in_progress', 'completed')).toBe(true);
    });

    it('devrait rejeter une transition invalide pending -> completed', () => {
      expect(isValidTransition('pending', 'completed')).toBe(false);
    });

    it('devrait rejeter une transition invalide completed -> pending', () => {
      expect(isValidTransition('completed', 'pending')).toBe(false);
    });

    it('devrait accepter une transition vers le même statut', () => {
      expect(isValidTransition('pending', 'pending')).toBe(true);
    });
  });

  describe('canTransition', () => {
    it('devrait permettre une transition valide pending -> accepted', () => {
      expect(canTransition('pending', 'accepted')).toBe(true);
    });

    it('devrait rejeter une transition depuis completed', () => {
      expect(canTransition('completed', 'pending')).toBe(false);
      expect(canTransition('completed', 'accepted')).toBe(false);
    });

    it('devrait rejeter une transition depuis cancelled', () => {
      expect(canTransition('cancelled', 'pending')).toBe(false);
      expect(canTransition('cancelled', 'accepted')).toBe(false);
    });

    it('devrait rejeter une transition invalide même si le statut source est valide', () => {
      expect(canTransition('pending', 'completed')).toBe(false);
    });
  });

  describe('isValidStatus', () => {
    it('devrait valider les statuts autorisés', () => {
      expect(isValidStatus('pending')).toBe(true);
      expect(isValidStatus('accepted')).toBe(true);
      expect(isValidStatus('in_progress')).toBe(true);
      expect(isValidStatus('completed')).toBe(true);
      expect(isValidStatus('cancelled')).toBe(true);
    });

    it('devrait rejeter les statuts invalides', () => {
      expect(isValidStatus('invalid')).toBe(false);
      expect(isValidStatus('')).toBe(false);
      expect(isValidStatus('PENDING')).toBe(false);
    });
  });
});
