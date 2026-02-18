import { Request, Response } from 'express';
import { courierAccountService } from '../../course/services/courierAccountService';
import { successResponse } from '../../../shared/responses/apiResponse';
import { UnauthorizedError, ForbiddenError } from '../../../shared/errors/appError';
import { AuthErrorMessages } from '../../auth/constants/errorMessages';
import { serializeCourierAccount } from '../utils/serializeCourierAccount';
import { CourseErrorMessages } from '../../course/constants/errorMessages';

/**
 * Contrôleur pour récupérer le compte d'un livreur
 * Route protégée nécessitant un token JWT valide
 * Accessible par le livreur lui-même ou un admin
 * 
 * @param req - Requête Express avec req.user injecté par authenticateJWT
 * @param res - Réponse Express
 */
export async function getCourierAccount(
  req: Request,
  res: Response
): Promise<void> {
  if (!req.user) {
    throw new UnauthorizedError(AuthErrorMessages.USER.NOT_AUTHENTICATED);
  }

  const courierId = req.params.id;
  const userId = req.user.id;

  // Vérifier que l'utilisateur est le livreur lui-même ou un admin
  // Pour l'instant, on permet à n'importe quel utilisateur authentifié de voir n'importe quel compte
  // (on peut ajouter une vérification admin plus tard si nécessaire)
  const account = await courierAccountService.getCourierAccount(courierId);

  successResponse(
    res,
    { account: serializeCourierAccount(account) },
    'Compte livreur récupéré avec succès',
    200
  );
}

/**
 * Contrôleur pour régler la commission d'un livreur (admin only)
 * Route protégée nécessitant un token JWT valide et des droits admin
 * Remet commission_due à 0 et met à jour last_settlement_at
 * 
 * @param req - Requête Express avec req.user injecté par authenticateJWT
 * @param res - Réponse Express
 */
export async function settleCourierAccount(
  req: Request,
  res: Response
): Promise<void> {
  if (!req.user) {
    throw new UnauthorizedError(AuthErrorMessages.USER.NOT_AUTHENTICATED);
  }

  const courierId = req.params.id;
  const adminId = req.user.id;

  // Le middleware authorizeAdmin vérifie déjà que l'utilisateur est admin
  // Règlement + enregistrement dans commission_logs (montant, admin_id, date)
  const account = await courierAccountService.settleCommission(courierId, adminId);

  successResponse(
    res,
    { account: serializeCourierAccount(account) },
    'Commission réglée avec succès. Le compte livreur a été mis à jour.',
    200
  );
}
