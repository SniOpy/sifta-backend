import pool from '../../../config/database';
import { OTPCode, OTPRole } from '../types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Crée un nouveau code OTP en base de données (S05-BE-Correction: role stocké avec l'OTP).
 */
export async function createOTP(
  phone: string,
  codeHash: string,
  expiresAt: Date,
  role: OTPRole | null = null
): Promise<OTPCode> {
  const id = uuidv4();
  const query = `
    INSERT INTO otp_codes (id, phone, code_hash, expires_at, attempts, created_at, role)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `;
  const result = await pool.query(query, [
    id,
    phone,
    codeHash,
    expiresAt,
    0,
    new Date(),
    role,
  ]);
  return mapRowToOTP(result.rows[0]);
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

  if (result.rows.length === 0) return null;
  return mapRowToOTP(result.rows[0]);
}

function mapRowToOTP(row: any): OTPCode {
  return {
    id: row.id,
    phone: row.phone,
    code_hash: row.code_hash,
    expires_at: new Date(row.expires_at),
    attempts: row.attempts,
    created_at: new Date(row.created_at),
    role: row.role ?? null,
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

  if (result.rows.length === 0) return null;
  return mapRowToOTP(result.rows[0]);
}

/**
 * Trouve un OTP par son ID
 * @param id - ID de l'OTP
 * @returns L'OTP ou null
 */
export async function findOTPById(id: string): Promise<OTPCode | null> {
  const query = 'SELECT * FROM otp_codes WHERE id = $1';
  const result = await pool.query(query, [id]);

  if (result.rows.length === 0) return null;
  return mapRowToOTP(result.rows[0]);
}
