/**
 * Types pour le domaine token
 */

/**
 * Payload JWT standardisé pour Access Token (S05-BE-Correction: role pour requireRole)
 */
export interface JWTPayload {
  sub: string;
  phone: string;
  role?: 'seller' | 'courier' | null;
  onboarding_completed?: boolean;
  iat: number;
  exp: number;
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
