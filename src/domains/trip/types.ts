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
  /** Livreur ayant accepté la course (null si pending) */
  courier_id: string | null;
  /** S06-FS-T05: date/heure du claim (acceptation par le livreur) */
  assigned_at: Date | null;
  /** Ville de la course (phase test: Tanger) */
  city: string | null;
  /** Téléphone du client destinataire */
  customer_phone: string | null;
  /** Frais de livraison F (revenu livreur), figés à la création */
  delivery_fee: number | null;
  /** Commission Sokhra C (10% de F), ajoutée au total client */
  sokhra_commission: number | null;
  /** Jalons du flux */
  picked_up_at: Date | null;
  delivered_at: Date | null;
  /** Encaissement confirmé chez le client */
  cash_collected: boolean;
  /** Dernière position GPS connue du livreur (suivi live) */
  courier_lat: number | null;
  courier_lng: number | null;
  courier_location_at: Date | null;
}

/**
 * Données d'entrée pour créer un trajet
 */
export interface CreateTripInput {
  from: string;
  to: string;
  /** Montant produit M (obligatoire), à récupérer chez le client */
  price: number;
  currency?: string;
  city?: string;
  customer_phone?: string;
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
  /** Montant produit M (récupéré chez le client, avancé au vendeur) */
  order_amount: number | null;
  /** @deprecated alias de order_amount conservé pour compatibilité */
  amount_total: number | null;
  delivery_fee: number | null;
  commission: number | null;
  /** Total payé par le client (M + F + C) */
  client_total: number | null;
  created_at: Date;
  /** S06-FS-T03: présents si extraction depuis URL réussie */
  pickup_lat: number | null;
  pickup_lng: number | null;
  dropoff_lat: number | null;
  dropoff_lng: number | null;
  /** Suivi live du livreur */
  courier_lat: number | null;
  courier_lng: number | null;
  courier_location_at: Date | null;
  picked_up_at: Date | null;
  delivered_at: Date | null;
}

/**
 * DTO course disponible pour le livreur (GET /courier/trips/available) — S06-FS-T04
 */
export interface CourierAvailableTripResponse {
  id: string;
  pickup_location_url: string;
  dropoff_location_url: string;
  distance_km_estimated: number;
  eta_minutes_estimated: number;
  /** Montant produit M à récupérer chez le client */
  order_amount: number;
  /** @deprecated alias historique (= total client) */
  amount_total: number;
  delivery_fee: number;
  commission: number;
  /** Total à encaisser chez le client (M + F + C) */
  client_total: number;
  pickup_lat: number | null;
  pickup_lng: number | null;
  dropoff_lat: number | null;
  dropoff_lng: number | null;
}

/**
 * DTO détail mission livreur (GET /courier/trips/:id) — S06-FS-T06
 */
export interface CourierTripDetailResponse {
  id: string;
  status: TripStatus;
  pickup_url: string;
  dropoff_url: string;
  customer_phone: string | null;
  /** Montant produit M à récupérer chez le client */
  order_amount: number;
  /** @deprecated alias historique (= total client) */
  amount_total: number;
  delivery_fee: number;
  commission: number;
  /** Total à encaisser chez le client (M + F + C) */
  client_total: number;
  created_at: Date;
  pickup_lat: number | null;
  pickup_lng: number | null;
  dropoff_lat: number | null;
  dropoff_lng: number | null;
  picked_up_at: Date | null;
  delivered_at: Date | null;
}
