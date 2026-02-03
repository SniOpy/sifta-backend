/**
 * Types et interfaces pour l'authentification
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
 * Modèle User en base de données
 */
export interface User {
  id: string;
  phone: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Modèle OTP en base de données
 */
export interface OTPCode {
  id: string;
  phone: string;
  code_hash: string;
  expires_at: Date;
  attempts: number;
  created_at: Date;
}

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

/**
 * Résultat de validation de téléphone
 */
export interface PhoneValidationResult {
  valid: boolean;
  normalized?: string;
  error?: string;
}
