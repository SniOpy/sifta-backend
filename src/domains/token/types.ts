/**
 * Types pour le domaine token
 */

/**
 * Payload JWT standardisé pour Access Token
 */
export interface JWTPayload {
  sub: string; // Subject (user ID)
  phone: string; // Numéro de téléphone
  iat: number; // Issued at (timestamp)
  exp: number; // Expiration (timestamp)
}

/**
 * Paire de tokens (Access Token + Refresh Token)
 */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Modèle RefreshToken en base de données
 */
export interface RefreshToken {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  revoked: boolean;
  created_at: Date;
}
