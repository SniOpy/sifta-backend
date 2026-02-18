import { findUserByPhone, createUser, findUserById, updateUserFromVerify } from '../models/userModel';
import { User, UserRole } from '../types';

/**
 * Trouve ou crée l'utilisateur et applique le role de la session OTP (S05-BE-Correction).
 * À verify-otp on ne fait pas confiance au body: role vient de l'OTP (serveur).
 */
export async function findOrCreateUser(phone: string, sessionRole: UserRole): Promise<User> {
  const existing = await findUserByPhone(phone);
  if (existing) {
    const updated = await updateUserFromVerify(existing.id, sessionRole, true);
    return updated ?? existing;
  }
  try {
    return await createUser(phone, sessionRole, true);
  } catch (error: any) {
    if (error.code === '23505') {
      const user = await findUserByPhone(phone);
      if (user) {
        const updated = await updateUserFromVerify(user.id, sessionRole, true);
        return updated ?? user;
      }
    }
    throw error;
  }
}

/**
 * Récupère un utilisateur par son ID
 * @param id - ID de l'utilisateur
 * @returns L'utilisateur ou null
 */
export async function getUserById(id: string): Promise<User | null> {
  return findUserById(id);
}

/**
 * Récupère un utilisateur par son numéro de téléphone
 * @param phone - Numéro de téléphone
 * @returns L'utilisateur ou null
 */
export async function getUserByPhone(phone: string): Promise<User | null> {
  return findUserByPhone(phone);
}
