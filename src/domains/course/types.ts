/**
 * Types pour le domaine course (compte livreur, commissions)
 */

export interface CourierAccount {
  courier_id: string;
  total_jobs: number;
  commission_due: number;
  last_settlement_at: Date | null;
  is_blocked: boolean;
  created_at: Date;
  updated_at: Date;
}
