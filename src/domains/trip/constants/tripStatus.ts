/**
 * Constantes et utilitaires pour la gestion des statuts de trajet
 */

import { TripStatus } from '../types';

/**
 * Liste de tous les statuts autorisés
 */
export const TRIP_STATUSES: TripStatus[] = [
  'pending',
  'accepted',
  'in_progress',
  'completed',
  'cancelled',
];

/**
 * Map des transitions autorisées pour chaque statut
 * Clé : statut source, Valeur : liste des statuts de destination autorisés
 */
export const TRIP_STATUS_TRANSITIONS: Record<TripStatus, TripStatus[]> = {
  pending: ['accepted', 'cancelled'],
  accepted: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [], // Aucune transition depuis completed
  cancelled: [], // Aucune transition depuis cancelled
};

/**
 * Vérifie si une transition de statut est valide
 * @param from - Statut source
 * @param to - Statut de destination
 * @returns true si la transition est autorisée, false sinon
 */
export function isValidTransition(from: TripStatus, to: TripStatus): boolean {
  // Si les statuts sont identiques, la transition est valide (pas de changement)
  if (from === to) {
    return true;
  }

  // Vérifier si la transition est dans la liste des transitions autorisées
  const allowedTransitions = TRIP_STATUS_TRANSITIONS[from];
  return allowedTransitions.includes(to);
}

/**
 * Vérifie si un trajet peut effectuer une transition vers un nouveau statut
 * Cette fonction vérifie également que le trajet n'est pas déjà terminé ou annulé
 * @param from - Statut source
 * @param to - Statut de destination
 * @returns true si la transition est possible, false sinon
 */
export function canTransition(from: TripStatus, to: TripStatus): boolean {
  // Un trajet completed ne peut pas être modifié
  if (from === 'completed') {
    return false;
  }

  // Un trajet cancelled ne peut pas être modifié
  if (from === 'cancelled') {
    return false;
  }

  // Vérifier si la transition est valide
  return isValidTransition(from, to);
}

/**
 * Vérifie si un statut est valide
 * @param status - Statut à vérifier
 * @returns true si le statut est valide, false sinon
 */
export function isValidStatus(status: string): status is TripStatus {
  return TRIP_STATUSES.includes(status as TripStatus);
}
