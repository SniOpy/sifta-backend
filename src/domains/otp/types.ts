/**
 * Types pour le domaine OTP
 */

/** Role stored with OTP; source of truth at verify (S05-BE-Correction). */
export type OTPRole = 'seller' | 'courier';

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
  /** Set at request-otp; read at verify-otp (never trust client). */
  role: OTPRole | null;
}
