import { findUserByPhone, createUser, findUserById } from '../models/userModel';
import { User } from '../types';

/**
 * Trouve un utilisateur par son numéro de téléphone, ou le crée s'il n'existe pas
 * @param phone - Numéro de téléphone (déjà normalisé)
 * @returns L'utilisateur existant ou nouvellement créé
 */
export async function findOrCreateUser(phone: string): Promise<User> {
  // Essayer de trouver l'utilisateur existant
  const existingUser = await findUserByPhone(phone);
  if (existingUser) {
    return existingUser;
  }

  // Créer l'utilisateur s'il n'existe pas
  try {
    return await createUser(phone);
  } catch (error: any) {
    // Si erreur de contrainte unique (race condition), réessayer de trouver
    if (error.code === '23505') {
      const user = await findUserByPhone(phone);
      if (user) {
        return user;
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
