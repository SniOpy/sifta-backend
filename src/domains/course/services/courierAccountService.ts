import { NotFoundError } from '../../../shared/errors/appError';
import { CourseErrorMessages } from '../constants/errorMessages';
import {
  findOrCreateCourierAccount,
  settleCourierAccountInTransaction,
} from '../models/courierAccountModel';
import { CourierAccount } from '../types';

/**
 * Récupère le compte d'un livreur (crée le compte si inexistant)
 */
export async function getCourierAccount(courierId: string): Promise<CourierAccount> {
  return findOrCreateCourierAccount(courierId);
}

/**
 * Règle la commission d'un livreur (transactionnel : read → update → insert commission_logs).
 * Crée le compte s'il n'existe pas avant la transaction.
 */
export async function settleCommission(courierId: string, adminId: string): Promise<CourierAccount> {
  await findOrCreateCourierAccount(courierId);
  const updated = await settleCourierAccountInTransaction(courierId, adminId);
  if (!updated) {
    throw new NotFoundError(CourseErrorMessages.ACCOUNT.NOT_FOUND);
  }
  return updated;
}

export const courierAccountService = {
  getCourierAccount,
  settleCommission,
};
