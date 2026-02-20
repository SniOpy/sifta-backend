/**
 * Messages d'erreur centralisés pour le domaine trips
 * Assure la cohérence et la normalisation des messages d'erreur
 */

import { TripStatus } from '../types';

export const TripErrorMessages = {
  /**
   * Messages d'erreur liés aux trajets
   */
  TRIP: {
    NOT_FOUND: 'Trajet non trouvé',
    NOT_OWNER: 'Vous n\'êtes pas autorisé à accéder à ce trajet',
    CANNOT_MODIFY_COMPLETED: 'Un trajet terminé ne peut pas être modifié',
    CANNOT_MODIFY_CANCELLED: 'Un trajet annulé ne peut pas être modifié',
    CANNOT_CANCEL: 'Ce trajet ne peut pas être annulé',
    INVALID_TRANSITION: (from: TripStatus, to: TripStatus): string =>
      `La transition de statut de "${from}" vers "${to}" n'est pas autorisée`,
    INVALID_STATUS: (status: string): string =>
      `Le statut "${status}" n'est pas valide. Statuts autorisés: pending, accepted, in_progress, completed, cancelled`,
  },

  /**
   * Messages d'erreur liés à la validation
   */
  VALIDATION: {
    FROM_REQUIRED: 'L\'adresse de départ est requise',
    TO_REQUIRED: 'L\'adresse d\'arrivée est requise',
    FROM_TOO_LONG: 'L\'adresse de départ ne peut pas dépasser 255 caractères',
    TO_TOO_LONG: 'L\'adresse d\'arrivée ne peut pas dépasser 255 caractères',
    PRICE_INVALID: 'Le prix doit être un nombre positif',
    PRICE_TOO_HIGH: 'Le prix ne peut pas dépasser 999999.99',
    CURRENCY_INVALID: 'La devise doit contenir exactement 3 caractères',
    TRIP_ID_INVALID: 'L\'identifiant du trajet doit être un UUID valide',
    PAGE_INVALID: 'Le numéro de page doit être supérieur ou égal à 1',
    LIMIT_INVALID: 'La limite doit être entre 1 et 100',
    STATUS_INVALID: 'Le statut fourni n\'est pas valide',
    PICKUP_REQUIRED: 'L\'URL de lieu de prise en charge est requise',
    DROPOFF_REQUIRED: 'L\'URL de lieu de livraison est requise',
    LOCATION_URL_INVALID: 'L\'URL doit commencer par http ou https (max 500 caractères)',
  },
};
