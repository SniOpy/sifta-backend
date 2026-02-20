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
  const canAccess = courierId === req.user!.id || req.user!.is_admin;
  if (!canAccess) {
    throw new ForbiddenError(CourierErrorMessages.AUTH.NOT_OWNER_OR_ADMIN);
  }
  const account = await courierAccountService.getCourierAccount(courierId);

  successResponse(
    res,
    { account: serializeCourierAccount(account) },
    'Compte livreur récupéré avec succès',
    200
  );
}

/**
 * GET /couriers/me/account — le livreur récupère son propre compte (requireRole('courier')).
 */
export async function getMyCourierAccount(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new UnauthorizedError(AuthErrorMessages.USER.NOT_AUTHENTICATED);
  }
  const account = await courierAccountService.getCourierAccount(req.user.id);
  successResponse(
    res,
    { account: serializeCourierAccount(account) },
    'Compte livreur récupéré avec succès',
    200
  );
}

/**
 * POST /couriers/me/settle — admin règle son propre compte courier (requireAdmin).
 */
export async function settleMyCourierAccount(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new UnauthorizedError(AuthErrorMessages.USER.NOT_AUTHENTICATED);
  }
  const account = await courierAccountService.settleCommission(req.user.id, req.user.id);
  successResponse(
    res,
    { account: serializeCourierAccount(account) },
    'Commission réglée avec succès. Le compte livreur a été mis à jour.',
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
