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
 * Résultat de validation de téléphone
 */
export interface PhoneValidationResult {
  valid: boolean;
  normalized?: string;
  error?: string;
}
