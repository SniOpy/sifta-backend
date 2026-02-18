import pool from '../../../config/database';
import { User, UserRole } from '../types';
import { v4 as uuidv4 } from 'uuid';

function mapRowToUser(row: any): User {
  return {
    id: row.id,
    phone: row.phone,
    role: row.role ?? (row.account_type ?? null),
    onboarding_completed: row.onboarding_completed ?? false,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
  };
}

/**
 * Crée un nouvel utilisateur (S05-BE-Correction: role + onboarding_completed).
 */
export async function createUser(
  phone: string,
  role: UserRole | null = null,
  onboardingCompleted: boolean = false
): Promise<User> {
  const id = uuidv4();
  const query = `
    INSERT INTO users (id, phone, role, onboarding_completed, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;
  const result = await pool.query(query, [
    id,
    phone,
    role,
    onboardingCompleted,
    new Date(),
    new Date(),
  ]);
  return mapRowToUser(result.rows[0]);
}

/**
 * Met à jour role et onboarding_completed après verify-otp (source de vérité = session OTP).
 */
export async function updateUserFromVerify(
  userId: string,
  role: UserRole,
  onboardingCompleted: boolean = true
): Promise<User | null> {
  const query = `
    UPDATE users
    SET role = $1, onboarding_completed = $2, updated_at = CURRENT_TIMESTAMP
    WHERE id = $3
    RETURNING *
  `;
  const result = await pool.query(query, [role, onboardingCompleted, userId]);
  if (result.rows.length === 0) return null;
  return mapRowToUser(result.rows[0]);
}

/**
 * Trouve un utilisateur par son numéro de téléphone
 * @param phone - Numéro de téléphone
 * @returns L'utilisateur ou null
 */
export async function findUserByPhone(phone: string): Promise<User | null> {
  const query = 'SELECT * FROM users WHERE phone = $1';
  const result = await pool.query(query, [phone]);

  if (result.rows.length === 0) return null;
  return mapRowToUser(result.rows[0]);
}

/**
 * Trouve un utilisateur par son ID
 * @param id - ID de l'utilisateur
 * @returns L'utilisateur ou null
 */
export async function findUserById(id: string): Promise<User | null> {
  const query = 'SELECT * FROM users WHERE id = $1';
  const result = await pool.query(query, [id]);

  if (result.rows.length === 0) return null;
  return mapRowToUser(result.rows[0]);
}
