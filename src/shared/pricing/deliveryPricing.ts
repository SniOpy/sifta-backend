/**
 * Tarification de la livraison (centralise, facile  ajuster).
 *
 * Modle d'argent :
 * - M = montant produit saisi par le vendeur (rcupr chez le client).
 * - F = frais de livraison, calculs selon la distance pickup -> dropoff.
 * - C = commission Sokhra = COMMISSION_RATE * F, ajoute au total client.
 * - Total client = M + F + C. Le livreur avance M au vendeur, encaisse M+F+C
 *   chez le client, garde F et doit C  Sokhra (courier_account.commission_due).
 */

/** Part fixe des frais de livraison (DH) */
export const DELIVERY_BASE_FEE = 10;
/** Part variable des frais de livraison (DH par km) */
export const DELIVERY_PER_KM = 3;
/** Frais de livraison minimum (DH) */
export const MIN_DELIVERY_FEE = 20;
/** Taux de commission Sokhra appliqu aux frais de livraison */
export const COMMISSION_RATE = 0.1;
/** Commission Sokhra minimum (DH) : sinon 10% des frais de livraison */
export const MIN_COMMISSION = 3;
/** Estimation du temps de trajet : minutes par km */
export const ETA_MIN_PER_KM = 2;
/** Rayon de gofence pour confirmer la prise en charge (km) */
export const PICKUP_GEOFENCE_KM = 0.15;
/**
 * Active la verification de proximite (geofence) a la prise en charge.
 * TEMPORAIRE : desactive pour la phase de test (impossible de valider sur place
 * en local). A repasser a `true` pour la version en ligne.
 */
export const PICKUP_GEOFENCE_ENABLED = false;

export interface DeliveryPricing {
  /** Montant produit (M), saisi par le vendeur */
  orderAmount: number;
  /** Frais de livraison (F) */
  deliveryFee: number;
  /** Commission Sokhra (C) */
  commission: number;
  /** Total pay par le client (M + F + C) */
  clientTotal: number;
}

/**
 * Calcule les frais de livraison, la commission et le total client.
 * @param distanceKm - distance pickup -> dropoff en km
 * @param orderAmount - montant produit M (>= 0)
 */
export function computeDeliveryPricing(distanceKm: number, orderAmount: number): DeliveryPricing {
  const safeDistance = Number.isFinite(distanceKm) && distanceKm > 0 ? distanceKm : 0;
  const safeAmount = Number.isFinite(orderAmount) && orderAmount > 0 ? orderAmount : 0;

  const rawFee = DELIVERY_BASE_FEE + DELIVERY_PER_KM * safeDistance;
  const deliveryFee = Math.max(MIN_DELIVERY_FEE, Math.round(rawFee));
  const commission = Math.max(MIN_COMMISSION, Math.round(deliveryFee * COMMISSION_RATE));
  const clientTotal = Math.round(safeAmount + deliveryFee + commission);

  return {
    orderAmount: Math.round(safeAmount),
    deliveryFee,
    commission,
    clientTotal,
  };
}
