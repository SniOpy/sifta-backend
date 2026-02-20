/**
 * Types pour le domaine utilisateur (S05-BE-Correction: role + onboarding_completed)
 */
export type UserRole = 'seller' | 'courier';

export interface User {
  id: string;
  phone: string;
  role: UserRole | null;
  onboarding_completed: boolean;
  is_admin: boolean;
  created_at: Date;
  updated_at: Date;
}
