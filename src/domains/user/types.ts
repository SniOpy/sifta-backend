/**
 * Types pour le domaine utilisateur
 */

/**
 * Modèle User en base de données
 */
export interface User {
  id: string;
  phone: string;
  created_at: Date;
  updated_at: Date;
}
