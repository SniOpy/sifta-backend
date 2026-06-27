import pool from '../../../config/database';
import { CourierAccount } from '../types';
import { v4 as uuidv4 } from 'uuid';

function mapRowToCourierAccount(row: any): CourierAccount {
  return {
    courier_id: row.courier_id,
    total_jobs: parseInt(String(row.total_jobs), 10) || 0,
    commission_due: parseFloat(String(row.commission_due)) || 0,
    last_settlement_at: row.last_settlement_at ? new Date(row.last_settlement_at) : null,
    is_blocked: Boolean(row.is_blocked),
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
  };
}

/**
 * Récupère le compte livreur par courier_id
 */
export async function findCourierAccountById(courierId: string): Promise<CourierAccount | null> {
  const query = 'SELECT * FROM courier_account WHERE courier_id = $1';
  const result = await pool.query(query, [courierId]);
  if (result.rows.length === 0) return null;
  return mapRowToCourierAccount(result.rows[0]);
}

/**
 * Crée un compte livreur (ou retourne l'existant si présent)
 */
export async function findOrCreateCourierAccount(courierId: string): Promise<CourierAccount> {
  const existing = await findCourierAccountById(courierId);
  if (existing) return existing;
  const query = `
    INSERT INTO courier_account (courier_id, total_jobs, commission_due, last_settlement_at, is_blocked, created_at, updated_at)
    VALUES ($1, 0, 0.00, NULL, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    RETURNING *
  `;
  const result = await pool.query(query, [courierId]);
  return mapRowToCourierAccount(result.rows[0]);
}

/**
 * Remet commission_due à 0 et met à jour last_settlement_at
 */
export async function settleCourierAccount(courierId: string): Promise<CourierAccount | null> {
  const query = `
    UPDATE courier_account
    SET commission_due = 0, last_settlement_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE courier_id = $1
    RETURNING *
  `;
  const result = await pool.query(query, [courierId]);
  if (result.rows.length === 0) return null;
  return mapRowToCourierAccount(result.rows[0]);
}

/**
 * Crédite la commission due d'un livreur à la livraison d'une course.
 * Crée le compte si besoin, puis incrémente commission_due et total_jobs (atomique).
 */
export async function incrementCommissionDue(
  courierId: string,
  amount: number
): Promise<CourierAccount> {
  await findOrCreateCourierAccount(courierId);
  const query = `
    UPDATE courier_account
    SET commission_due = commission_due + $2,
        total_jobs = total_jobs + 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE courier_id = $1
    RETURNING *
  `;
  const result = await pool.query(query, [courierId, amount]);
  return mapRowToCourierAccount(result.rows[0]);
}

/**
 * Enregistre un règlement dans commission_logs
 */
export async function insertCommissionLog(
  courierId: string,
  amountPaid: number,
  adminId: string
): Promise<void> {
  const id = uuidv4();
  const query = `
    INSERT INTO commission_logs (id, courier_id, amount_paid, admin_id, settled_at, created_at)
    VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `;
  await pool.query(query, [id, courierId, amountPaid, adminId]);
}

/**
 * Règle la commission dans une transaction : SELECT FOR UPDATE → UPDATE → INSERT commission_logs.
 * Retourne le compte mis à jour ou null si le compte n'existe pas.
 */
export async function settleCourierAccountInTransaction(
  courierId: string,
  adminId: string
): Promise<CourierAccount | null> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const selectResult = await client.query(
      'SELECT commission_due FROM courier_account WHERE courier_id = $1 FOR UPDATE',
      [courierId]
    );
    if (selectResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return null;
    }
    const amountPaid = parseFloat(String(selectResult.rows[0].commission_due)) || 0;
    const updateResult = await client.query(
      `UPDATE courier_account
       SET commission_due = 0, last_settlement_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE courier_id = $1
       RETURNING *`,
      [courierId]
    );
    const logId = uuidv4();
    await client.query(
      `INSERT INTO commission_logs (id, courier_id, amount_paid, admin_id, settled_at, created_at)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [logId, courierId, amountPaid, adminId]
    );
    await client.query('COMMIT');
    return mapRowToCourierAccount(updateResult.rows[0]);
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}
