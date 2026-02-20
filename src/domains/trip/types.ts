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
  /** S06-FS-T03: coordonnées extraites d'URL (pickup = from_location) */
  pickup_lat: number | null;
  pickup_lng: number | null;
  dropoff_lat: number | null;
  dropoff_lng: number | null;
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

/**
 * DTO de détail trip pour le vendeur (GET /seller/trips/:id)
 */
export interface SellerTripDetailResponse {
  id: string;
  status: TripStatus;
  courier_id: string | null;
  pickup_url: string;
  dropoff_url: string;
  customer_phone: string | null;
  amount_total: number | null;
  delivery_fee: number | null;
  created_at: Date;
  /** S06-FS-T03: présents si extraction depuis URL réussie */
  pickup_lat: number | null;
  pickup_lng: number | null;
  dropoff_lat: number | null;
  dropoff_lng: number | null;
}
