import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { createOTP, deleteOTPByPhone, deleteExpiredOTPs } from '../models/OTPCode';

dotenv.config();

const OTP_LENGTH = parseInt(process.env.OTP_LENGTH || '6', 10);
const OTP_EXPIRES_IN_MINUTES = parseInt(process.env.OTP_EXPIRES_IN_MINUTES || '5', 10);
const BCRYPT_ROUNDS = 10;

/**
 * Génère un code OTP aléatoire
 * @param length - Longueur du code (défaut: 6)
 * @returns Code OTP à 6 chiffres
 */
export function generateOTP(length: number = OTP_LENGTH): string {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  const code = Math.floor(Math.random() * (max - min + 1)) + min;
  return code.toString().padStart(length, '0');
}

/**
 * Hash un code OTP avec bcrypt
 * @param code - Code OTP en clair
 * @returns Hash bcrypt du code
 */
export async function hashOTP(code: string): Promise<string> {
  return bcrypt.hash(code, BCRYPT_ROUNDS);
}

/**
 * Vérifie un code OTP contre son hash
 * @param code - Code OTP en clair
 * @param hash - Hash bcrypt du code
 * @returns true si le code correspond au hash
 */
export async function verifyOTP(code: string, hash: string): Promise<boolean> {
  return bcrypt.compare(code, hash);
}

/**
 * Crée un OTP pour un téléphone donné
 * Supprime d'abord tous les OTP actifs existants pour ce téléphone
 * @param phone - Numéro de téléphone
 * @returns Le code OTP en clair (pour envoi SMS)
 */
export async function createOTPForPhone(phone: string): Promise<string> {
  // Supprimer tous les OTP actifs existants pour ce téléphone
  await deleteOTPByPhone(phone);

  // Générer un nouveau code OTP
  const code = generateOTP(OTP_LENGTH);

  // Hash le code
  const codeHash = await hashOTP(code);

  // Calculer la date d'expiration
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + OTP_EXPIRES_IN_MINUTES);

  // Stocker en base de données
  await createOTP(phone, codeHash, expiresAt);

  // Retourner le code en clair pour envoi SMS
  return code;
}

/**
 * Nettoie les codes OTP expirés (pour maintenance)
 * @returns Nombre de codes supprimés
 */
export async function cleanExpiredOTPs(): Promise<number> {
  return deleteExpiredOTPs();
}
