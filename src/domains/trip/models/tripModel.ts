import pool from '../../../config/database';
import { Trip, TripStatus, TripFilters } from '../types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Crée un nouveau trajet en base de données
 * @param userId - ID de l'utilisateur propriétaire
 * @param fromLocation - Adresse de départ (URL ou texte)
 * @param toLocation - Adresse d'arrivée (URL ou texte)
 * @param price - Prix du trajet (optionnel)
 * @param currency - Devise (optionnel, défaut: MAD)
 * @param pickupLatLng - Coordonnées pickup si extraites (S06-FS-T03)
 * @param dropoffLatLng - Coordonnées dropoff si extraites
 * @returns Le trajet créé
 */
export async function createTrip(
  userId: string,
  fromLocation: string,
  toLocation: string,
  price?: number | null,
  currency: string = 'MAD',
  pickupLatLng?: { lat: number; lng: number } | null,
  dropoffLatLng?: { lat: number; lng: number } | null,
  city?: string | null,
  customerPhone?: string | null,
  deliveryFee?: number | null,
  sokhraCommission?: number | null
): Promise<Trip> {
  const id = uuidv4();
  const query = `
    INSERT INTO trips (id, user_id, from_location, to_location, status, price, currency, payment_status, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng, city, customer_phone, delivery_fee, sokhra_commission)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
    RETURNING *
  `;

  const result = await pool.query(query, [
    id,
    userId,
    fromLocation,
    toLocation,
    'pending',
    price ?? null,
    currency,
    'pending',
    pickupLatLng?.lat ?? null,
    pickupLatLng?.lng ?? null,
    dropoffLatLng?.lat ?? null,
    dropoffLatLng?.lng ?? null,
    city ?? null,
    customerPhone ?? null,
    deliveryFee ?? null,
    sokhraCommission ?? null,
  ]);

  const row = result.rows[0];
  return mapRowToTrip(row);
}

/**
 * Trouve un trajet par son ID
 * @param id - ID du trajet
 * @returns Le trajet ou null
 */
export async function findTripById(id: string): Promise<Trip | null> {
  const query = 'SELECT * FROM trips WHERE id = $1';
  const result = await pool.query(query, [id]);

  if (result.rows.length === 0) {
    return null;
  }

  return mapRowToTrip(result.rows[0]);
}

/**
 * Trouve tous les trajets d'un utilisateur avec pagination et filtres
 * @param userId - ID de l'utilisateur
 * @param filters - Filtres optionnels (status, page, limit)
 * @returns Liste des trajets et métadonnées de pagination
 */
export async function findTripsByUserId(
  userId: string,
  filters: TripFilters = {}
): Promise<{ trips: Trip[]; total: number }> {
  const { status, page = 1, limit = 10 } = filters;
  const offset = (page - 1) * limit;

  // Construire la clause WHERE
  let whereClause = 'WHERE user_id = $1';
  const queryParams: any[] = [userId];
  let paramIndex = 2;

  if (status) {
    whereClause += ` AND status = $${paramIndex}`;
    queryParams.push(status);
    paramIndex++;
  }

  // Requête pour compter le total
  const countQuery = `SELECT COUNT(*) as total FROM trips ${whereClause}`;
  const countResult = await pool.query(countQuery, queryParams);
  const total = parseInt(countResult.rows[0].total, 10);

  // Requête pour récupérer les trajets avec pagination
  const query = `
    SELECT * FROM trips
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;
  queryParams.push(limit, offset);

  const result = await pool.query(query, queryParams);

  const trips = result.rows.map(mapRowToTrip);

  return {
    trips,
    total,
  };
}

/**
 * Met à jour le statut d'un trajet
 * @param id - ID du trajet
 * @param newStatus - Nouveau statut
 * @returns Le trajet mis à jour
 */
export async function updateTripStatus(
  id: string,
  newStatus: TripStatus
): Promise<Trip> {
  const query = `
    UPDATE trips
    SET status = $1, updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
    RETURNING *
  `;

  const result = await pool.query(query, [newStatus, id]);

  if (result.rows.length === 0) {
    throw new Error(`Trajet ${id} non trouvé`);
  }

  return mapRowToTrip(result.rows[0]);
}

/**
 * Met à jour un trajet avec des champs spécifiques
 * @param id - ID du trajet
 * @param updates - Objet contenant les champs à mettre à jour
 * @returns Le trajet mis à jour
 */
export async function updateTrip(
  id: string,
  updates: Partial<Pick<Trip, 'from_location' | 'to_location' | 'price' | 'currency' | 'payment_status'>>
): Promise<Trip> {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (updates.from_location !== undefined) {
    fields.push(`from_location = $${paramIndex++}`);
    values.push(updates.from_location);
  }
  if (updates.to_location !== undefined) {
    fields.push(`to_location = $${paramIndex++}`);
    values.push(updates.to_location);
  }
  if (updates.price !== undefined) {
    fields.push(`price = $${paramIndex++}`);
    values.push(updates.price);
  }
  if (updates.currency !== undefined) {
    fields.push(`currency = $${paramIndex++}`);
    values.push(updates.currency);
  }
  if (updates.payment_status !== undefined) {
    fields.push(`payment_status = $${paramIndex++}`);
    values.push(updates.payment_status);
  }

  if (fields.length === 0) {
    // Aucune mise à jour, retourner le trajet tel quel
    const trip = await findTripById(id);
    if (!trip) {
      throw new Error(`Trajet ${id} non trouvé`);
    }
    return trip;
  }

  fields.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);

  const query = `
    UPDATE trips
    SET ${fields.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *
  `;

  const result = await pool.query(query, values);

  if (result.rows.length === 0) {
    throw new Error(`Trajet ${id} non trouvé`);
  }

  return mapRowToTrip(result.rows[0]);
}

/**
 * Trouve les trajets disponibles (status pending) avec coords pickup dans une bbox.
 * S06-FS-T04: feed livreur available trips (filtre haversine 3 km fait côté service).
 */
export async function findTripsAvailableInBoundingBox(
  minLat: number,
  maxLat: number,
  minLng: number,
  maxLng: number
): Promise<Trip[]> {
  const query = `
    SELECT * FROM trips
    WHERE status = 'pending'
      AND pickup_lat IS NOT NULL AND pickup_lng IS NOT NULL
      AND pickup_lat BETWEEN $1 AND $2
      AND pickup_lng BETWEEN $3 AND $4
    ORDER BY created_at DESC
  `;
  const result = await pool.query(query, [minLat, maxLat, minLng, maxLng]);
  return result.rows.map(mapRowToTrip);
}

/**
 * Claim une course par un livreur : atomique "first accept wins".
 * UPDATE uniquement si status = pending ET courier_id IS NULL.
 * Retourne le trip mis à jour ou null si déjà pris / inexistant.
 */
export async function claimTripById(
  tripId: string,
  courierId: string
): Promise<Trip | null> {
  const query = `
    UPDATE trips
    SET status = 'accepted', courier_id = $1, assigned_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = $2 AND status = 'pending' AND courier_id IS NULL
    RETURNING *
  `;
  const result = await pool.query(query, [courierId, tripId]);
  if (result.rows.length === 0) return null;
  return mapRowToTrip(result.rows[0]);
}

/**
 * Confirme la réception (pickup) : accepted -> in_progress.
 * Atomique : uniquement si le trip appartient au livreur et est 'accepted'.
 * Retourne le trip mis à jour ou null si non applicable.
 */
export async function markTripPickedUp(
  tripId: string,
  courierId: string
): Promise<Trip | null> {
  const query = `
    UPDATE trips
    SET status = 'in_progress', picked_up_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = $1 AND courier_id = $2 AND status = 'accepted'
    RETURNING *
  `;
  const result = await pool.query(query, [tripId, courierId]);
  if (result.rows.length === 0) return null;
  return mapRowToTrip(result.rows[0]);
}

/**
 * Confirme la livraison + encaissement : in_progress -> completed.
 * Atomique : uniquement si le trip appartient au livreur et est 'in_progress'.
 * Marque payment_status='paid' et cash_collected=true.
 * Retourne le trip mis à jour ou null si non applicable.
 */
export async function markTripDelivered(
  tripId: string,
  courierId: string
): Promise<Trip | null> {
  const query = `
    UPDATE trips
    SET status = 'completed', delivered_at = CURRENT_TIMESTAMP, cash_collected = true,
        payment_status = 'paid', updated_at = CURRENT_TIMESTAMP
    WHERE id = $1 AND courier_id = $2 AND status = 'in_progress'
    RETURNING *
  `;
  const result = await pool.query(query, [tripId, courierId]);
  if (result.rows.length === 0) return null;
  return mapRowToTrip(result.rows[0]);
}

/**
 * Met à jour la dernière position GPS du livreur sur une course active.
 * Uniquement si le trip appartient au livreur et est accepted/in_progress.
 */
export async function updateCourierLocation(
  tripId: string,
  courierId: string,
  lat: number,
  lng: number
): Promise<Trip | null> {
  const query = `
    UPDATE trips
    SET courier_lat = $3, courier_lng = $4, courier_location_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = $1 AND courier_id = $2 AND status IN ('accepted', 'in_progress')
    RETURNING *
  `;
  const result = await pool.query(query, [tripId, courierId, lat, lng]);
  if (result.rows.length === 0) return null;
  return mapRowToTrip(result.rows[0]);
}

/**
 * Retourne la course active (accepted ou in_progress) d'un livreur, ou null.
 * Sert à imposer une seule course active à la fois.
 */
export async function findActiveTripByCourier(courierId: string): Promise<Trip | null> {
  const query = `
    SELECT * FROM trips
    WHERE courier_id = $1 AND status IN ('accepted', 'in_progress')
    ORDER BY assigned_at DESC
    LIMIT 1
  `;
  const result = await pool.query(query, [courierId]);
  if (result.rows.length === 0) return null;
  return mapRowToTrip(result.rows[0]);
}

/**
 * Supprime un trajet (principalement pour les tests)
 * @param id - ID du trajet
 */
export async function deleteTrip(id: string): Promise<void> {
  const query = 'DELETE FROM trips WHERE id = $1';
  await pool.query(query, [id]);
}

/**
 * Mappe une ligne de résultat SQL vers un objet Trip
 * @param row - Ligne de résultat de la base de données
 * @returns Objet Trip
 */
function mapRowToTrip(row: any): Trip {
  const num = (v: any) => (v != null && v !== '' ? parseFloat(v) : null);
  return {
    id: row.id,
    user_id: row.user_id,
    from_location: row.from_location,
    to_location: row.to_location,
    status: row.status as TripStatus,
    price: row.price !== null ? parseFloat(row.price) : null,
    currency: row.currency,
    payment_status: row.payment_status,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
    pickup_lat: num(row.pickup_lat),
    pickup_lng: num(row.pickup_lng),
    dropoff_lat: num(row.dropoff_lat),
    dropoff_lng: num(row.dropoff_lng),
    courier_id: row.courier_id ?? null,
    assigned_at: row.assigned_at != null ? new Date(row.assigned_at) : null,
    city: row.city ?? null,
    customer_phone: row.customer_phone ?? null,
    delivery_fee: num(row.delivery_fee),
    sokhra_commission: num(row.sokhra_commission),
    picked_up_at: row.picked_up_at != null ? new Date(row.picked_up_at) : null,
    delivered_at: row.delivered_at != null ? new Date(row.delivered_at) : null,
    cash_collected: Boolean(row.cash_collected),
    courier_lat: num(row.courier_lat),
    courier_lng: num(row.courier_lng),
    courier_location_at: row.courier_location_at != null ? new Date(row.courier_location_at) : null,
  };
}
