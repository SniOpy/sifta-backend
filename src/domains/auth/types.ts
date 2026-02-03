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

/**
 * Requête pour se déconnecter (logout)
 * Pas de body requis, l'utilisateur est identifié via le token JWT
 */
export interface LogoutRequest {
  // Vide, pas de body requis
}

/**
 * Réponse après déconnexion (logout)
 */
export interface LogoutResponse {
  success: boolean;
  message: string;
}
