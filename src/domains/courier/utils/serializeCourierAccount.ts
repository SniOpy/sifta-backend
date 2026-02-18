import { CourierAccount } from '../types';

/**
 * Sérialise un CourierAccount pour l'API en convertissant les dates en chaînes ISO
 * @param account - CourierAccount à sérialiser
 * @returns CourierAccount sérialisé avec dates en ISO strings
 */
export function serializeCourierAccount(
  account: CourierAccount
): Omit<CourierAccount, 'created_at' | 'updated_at' | 'last_settlement_at'> & {
  created_at: string;
  updated_at: string;
  last_settlement_at: string | null;
} {
  return {
    ...account,
    created_at: account.created_at instanceof Date 
      ? account.created_at.toISOString() 
      : new Date(account.created_at).toISOString(),
    updated_at: account.updated_at instanceof Date 
      ? account.updated_at.toISOString() 
      : new Date(account.updated_at).toISOString(),
    last_settlement_at: account.last_settlement_at 
      ? (account.last_settlement_at instanceof Date 
          ? account.last_settlement_at.toISOString() 
          : new Date(account.last_settlement_at).toISOString())
      : null,
  };
}
