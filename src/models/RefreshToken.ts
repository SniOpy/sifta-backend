import pool from '../config/database';
import { RefreshToken } from '../types/auth';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';

const BCRYPT_ROUNDS = 10;

/**
 * Hash un refresh token avec bcrypt
 * @param token - Refresh token en clair
 * @returns Hash bcrypt du token
 */
export async function hashRefreshToken(token: string): Promise<string> {
  return bcrypt.hash(token, BCRYPT_ROUNDS);
}

/**
 * Vérifie un refresh token contre son hash
 * @param token - Refresh token en clair
 * @param hash - Hash bcrypt du token
 * @returns true si le token correspond au hash
 */
export async function verifyRefreshTokenHash(
  token: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(token, hash);
}

/**
 * Sauvegarde un refresh token hashé en base de données
 * @param userId - ID de l'utilisateur
 * @param tokenHash - Hash bcrypt du refresh token
 * @param expiresAt - Date d'expiration
 * @returns Le refresh token créé avec son ID
 */
export async function saveRefreshToken(
  userId: string,
  tokenHash: string,
  expiresAt: Date
): Promise<RefreshToken> {
  const id = uuidv4();
  const query = `
    INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, revoked, created_at)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;

  const result = await pool.query(query, [
    id,
    userId,
    tokenHash,
    expiresAt,
    false,
    new Date(),
  ]);

  const row = result.rows[0];
  return {
    id: row.id,
    user_id: row.user_id,
    token_hash: row.token_hash,
    expires_at: new Date(row.expires_at),
    revoked: row.revoked,
    created_at: new Date(row.created_at),
  };
}

/**
 * Trouve un refresh token valide (non expiré, non révoqué) pour un utilisateur
 * et vérifie qu'il correspond au token fourni
 * @param userId - ID de l'utilisateur
 * @param token - Refresh token en clair
 * @returns Le refresh token trouvé ou null
 */
export async function findRefreshToken(
  userId: string,
  token: string
): Promise<RefreshToken | null> {
  const query = `
    SELECT * FROM refresh_tokens
    WHERE user_id = $1 
      AND expires_at > NOW() 
      AND revoked = FALSE
    ORDER BY created_at DESC
  `;

  const result = await pool.query(query, [userId]);

  if (result.rows.length === 0) {
    return null;
  }

  // Vérifier chaque token hashé jusqu'à trouver une correspondance
  for (const row of result.rows) {
    const isValid = await verifyRefreshTokenHash(token, row.token_hash);
    if (isValid) {
      return {
        id: row.id,
        user_id: row.user_id,
        token_hash: row.token_hash,
        expires_at: new Date(row.expires_at),
        revoked: row.revoked,
        created_at: new Date(row.created_at),
      };
    }
  }

  return null;
}

/**
 * Révoque un refresh token par son ID
 * @param tokenId - ID du refresh token
 * @returns Le refresh token révoqué ou null
 */
export async function revokeRefreshToken(
  tokenId: string
): Promise<RefreshToken | null> {
  const query = `
    UPDATE refresh_tokens
    SET revoked = TRUE
    WHERE id = $1
    RETURNING *
  `;

  const result = await pool.query(query, [tokenId]);

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    id: row.id,
    user_id: row.user_id,
    token_hash: row.token_hash,
    expires_at: new Date(row.expires_at),
    revoked: row.revoked,
    created_at: new Date(row.created_at),
  };
}

/**
 * Révoque tous les refresh tokens d'un utilisateur
 * @param userId - ID de l'utilisateur
 * @returns Nombre de tokens révoqués
 */
export async function revokeAllUserTokens(userId: string): Promise<number> {
  const query = `
    UPDATE refresh_tokens
    SET revoked = TRUE
    WHERE user_id = $1 AND revoked = FALSE
  `;

  const result = await pool.query(query, [userId]);
  return result.rowCount || 0;
}

/**
 * Supprime tous les refresh tokens expirés (pour maintenance)
 * @returns Nombre de tokens supprimés
 */
export async function deleteExpiredTokens(): Promise<number> {
  const query = 'DELETE FROM refresh_tokens WHERE expires_at <= NOW()';
  const result = await pool.query(query);
  return result.rowCount || 0;
}

/**
 * Trouve un refresh token par son ID
 * @param id - ID du refresh token
 * @returns Le refresh token ou null
 */
export async function findRefreshTokenById(
  id: string
): Promise<RefreshToken | null> {
  const query = 'SELECT * FROM refresh_tokens WHERE id = $1';
  const result = await pool.query(query, [id]);

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    id: row.id,
    user_id: row.user_id,
    token_hash: row.token_hash,
    expires_at: new Date(row.expires_at),
    revoked: row.revoked,
    created_at: new Date(row.created_at),
  };
}
