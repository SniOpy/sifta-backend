/**
 * Types pour le domaine d'authentification
 */

/**
 * Requête pour demander un code OTP
 */
export interface RequestOTPRequest {
  phone: string;
}

/**
 * Réponse après demande d'OTP
 */
export interface RequestOTPResponse {
  success: boolean;
  message: string;
}

/**
 * Requête pour vérifier un code OTP
 */
export interface VerifyOTPRequest {
  phone: string;
  code: string;
}

/**
 * Réponse après vérification d'OTP
 */
export interface VerifyOTPResponse {
  success: boolean;
  message: string;
  user?: UserMinimal;
  tokens?: TokenPair;
}

/**
 * Données utilisateur minimales retournées après vérification OTP
 */
export interface UserMinimal {
  id: string;
  phone: string;
  created_at: Date;
}

/**
 * Paire de tokens (Access Token + Refresh Token)
 */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Requête pour rafraîchir les tokens
 */
export interface RefreshTokenRequest {
  refreshToken: string;
}

/**
 * Réponse après rafraîchissement des tokens
 */
export interface RefreshTokenResponse {
  success: boolean;
  message: string;
  tokens: TokenPair;
}
