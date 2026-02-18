import { NotFoundError } from '../../../shared/errors/appError';
import { CourseErrorMessages } from '../constants/errorMessages';
import {
  findCourierAccountById,
  findOrCreateCourierAccount,
  settleCourierAccount as settleAccountInDb,
  insertCommissionLog,
} from '../models/courierAccountModel';
import { CourierAccount } from '../types';

/**
 * Récupère le compte d'un livreur (crée le compte si inexistant)
 */
export async function getCourierAccount(courierId: string): Promise<CourierAccount> {
  const account = await findOrCreateCourierAccount(courierId);
  return account;
}

/**
 * Règle la commission d'un livreur : remet commission_due à 0, enregistre dans commission_logs
 */
export async function settleCommission(courierId: string, adminId: string): Promise<CourierAccount> {
  const existing = await findCourierAccountById(courierId);
  const account = existing ?? (await findOrCreateCourierAccount(courierId));
  const amountPaid = Number(account.commission_due) || 0;

  const updated = await settleAccountInDb(courierId);
  if (!updated) {
    throw new NotFoundError(CourseErrorMessages.ACCOUNT.NOT_FOUND);
  }
  await insertCommissionLog(courierId, amountPaid, adminId);
  return updated;
}

export const courierAccountService = {
  getCourierAccount,
  settleCommission,
};
