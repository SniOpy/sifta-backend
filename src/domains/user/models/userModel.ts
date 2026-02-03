import pool from '../../../config/database';
import { User } from '../types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Crée un nouvel utilisateur en base de données
 * @param phone - Numéro de téléphone (déjà normalisé)
 * @returns L'utilisateur créé
 * @throws Error si le téléphone existe déjà (contrainte unique)
 */
export async function createUser(phone: string): Promise<User> {
  const id = uuidv4();
  const query = `
    INSERT INTO users (id, phone, created_at, updated_at)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;

  const result = await pool.query(query, [
    id,
    phone,
    new Date(),
    new Date(),
  ]);

  const row = result.rows[0];
  return {
    id: row.id,
    phone: row.phone,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
  };
}

/**
 * Trouve un utilisateur par son numéro de téléphone
 * @param phone - Numéro de téléphone
 * @returns L'utilisateur ou null
 */
export async function findUserByPhone(phone: string): Promise<User | null> {
  const query = 'SELECT * FROM users WHERE phone = $1';
  const result = await pool.query(query, [phone]);

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    id: row.id,
    phone: row.phone,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
  };
}

/**
 * Trouve un utilisateur par son ID
 * @param id - ID de l'utilisateur
 * @returns L'utilisateur ou null
 */
export async function findUserById(id: string): Promise<User | null> {
  const query = 'SELECT * FROM users WHERE id = $1';
  const result = await pool.query(query, [id]);

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    id: row.id,
    phone: row.phone,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
  };
}
