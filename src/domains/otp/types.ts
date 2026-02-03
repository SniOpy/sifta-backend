/**
 * Types pour le domaine OTP
 */

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
