import pool from '../../../config/database';
import { OTPCode } from '../types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Crée un nouveau code OTP en base de données
 * @param phone - Numéro de téléphone
 * @param codeHash - Hash bcrypt du code OTP
 * @param expiresAt - Date d'expiration
 * @returns L'OTP créé avec son ID
 */
export async function createOTP(
  phone: string,
  codeHash: string,
  expiresAt: Date
): Promise<OTPCode> {
  const id = uuidv4();
  const query = `
    INSERT INTO otp_codes (id, phone, code_hash, expires_at, attempts, created_at)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;

  const result = await pool.query(query, [
    id,
    phone,
    codeHash,
    expiresAt,
    0,
    new Date(),
  ]);

  return {
    id: result.rows[0].id,
    phone: result.rows[0].phone,
    code_hash: result.rows[0].code_hash,
    expires_at: new Date(result.rows[0].expires_at),
    attempts: result.rows[0].attempts,
    created_at: new Date(result.rows[0].created_at),
  };
}

/**
 * Trouve un OTP actif (non expiré) pour un téléphone
 * @param phone - Numéro de téléphone
 * @returns L'OTP actif ou null
 */
export async function findActiveOTP(phone: string): Promise<OTPCode | null> {
  const query = `
    SELECT * FROM otp_codes
    WHERE phone = $1 AND expires_at > NOW()
    ORDER BY created_at DESC
    LIMIT 1
  `;

  const result = await pool.query(query, [phone]);

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    id: row.id,
    phone: row.phone,
    code_hash: row.code_hash,
    expires_at: new Date(row.expires_at),
    attempts: row.attempts,
    created_at: new Date(row.created_at),
  };
}

/**
 * Supprime tous les OTP pour un téléphone donné
 * @param phone - Numéro de téléphone
 * @returns Nombre de lignes supprimées
 */
export async function deleteOTPByPhone(phone: string): Promise<number> {
  const query = 'DELETE FROM otp_codes WHERE phone = $1';
  const result = await pool.query(query, [phone]);
  return result.rowCount || 0;
}

/**
 * Supprime tous les OTP expirés (pour maintenance)
 * @returns Nombre de lignes supprimées
 */
export async function deleteExpiredOTPs(): Promise<number> {
  const query = 'DELETE FROM otp_codes WHERE expires_at <= NOW()';
  const result = await pool.query(query);
  return result.rowCount || 0;
}

/**
 * Incrémente le compteur de tentatives pour un OTP
 * @param otpId - ID de l'OTP
 * @returns L'OTP mis à jour
 */
export async function incrementAttempts(otpId: string): Promise<OTPCode | null> {
  const query = `
    UPDATE otp_codes
    SET attempts = attempts + 1
    WHERE id = $1
    RETURNING *
  `;

  const result = await pool.query(query, [otpId]);

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    id: row.id,
    phone: row.phone,
    code_hash: row.code_hash,
    expires_at: new Date(row.expires_at),
    attempts: row.attempts,
    created_at: new Date(row.created_at),
  };
}

/**
 * Trouve un OTP par son ID
 * @param id - ID de l'OTP
 * @returns L'OTP ou null
 */
export async function findOTPById(id: string): Promise<OTPCode | null> {
  const query = 'SELECT * FROM otp_codes WHERE id = $1';
  const result = await pool.query(query, [id]);

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    id: row.id,
    phone: row.phone,
    code_hash: row.code_hash,
    expires_at: new Date(row.expires_at),
    attempts: row.attempts,
    created_at: new Date(row.created_at),
  };
}
