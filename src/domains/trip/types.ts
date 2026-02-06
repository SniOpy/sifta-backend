/**
 * Types pour le domaine trips
 */

/**
 * Statuts possibles d'un trajet
 */
export type TripStatus = 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';

/**
 * Statuts possibles de paiement
 */
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

/**
 * Modèle Trip en base de données
 */
export interface Trip {
  id: string;
  user_id: string;
  from_location: string;
  to_location: string;
  status: TripStatus;
  price: number | null;
  currency: string;
  payment_status: PaymentStatus;
  created_at: Date;
  updated_at: Date;
}

/**
 * Données d'entrée pour créer un trajet
 */
export interface CreateTripInput {
  from: string;
  to: string;
  price?: number;
  currency?: string;
}

/**
 * Données d'entrée pour mettre à jour le statut d'un trajet
 */
export interface UpdateTripStatusInput {
  status: TripStatus;
}

/**
 * Filtres pour la liste des trajets
 */
export interface TripFilters {
  status?: TripStatus;
  page?: number;
  limit?: number;
}

/**
 * Résultat paginé de la liste des trajets
 */
export interface PaginatedTripsResult {
  trips: Trip[];
  total: number;
  page: number;
  limit: number;
}
