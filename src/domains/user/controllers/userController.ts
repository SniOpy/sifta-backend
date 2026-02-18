import { Request, Response } from 'express';
import { getUserById } from '../services/userService';
import { successResponse } from '../../../shared/responses/apiResponse';
import { UnauthorizedError, NotFoundError } from '../../../shared/errors/appError';
import { AuthErrorMessages } from '../../auth/constants/errorMessages';

/**
 * Contrôleur pour obtenir les informations de l'utilisateur authentifié
 * Route protégée nécessitant un token JWT valide
 * 
 * @param req - Requête Express avec req.user injecté par authenticateJWT
 * @param res - Réponse Express
 */
export async function getCurrentUser(
  req: Request,
  res: Response
): Promise<void> {
  // req.user est garanti d'exister grâce au middleware authenticateJWT
  // TypeScript le reconnaît comme UserMinimal | undefined, mais on sait qu'il existe ici
  if (!req.user) {
    // Cette erreur ne devrait jamais se produire si le middleware fonctionne correctement
    // mais on la gère pour la sécurité TypeScript
    throw new UnauthorizedError(AuthErrorMessages.USER.NOT_AUTHENTICATED);
  }

  // Charger l'utilisateur complet depuis la DB pour obtenir created_at et updated_at réels
  const user = await getUserById(req.user.id);

  if (!user) {
    throw new NotFoundError(AuthErrorMessages.USER.NOT_FOUND);
  }

  successResponse(
    res,
    {
      user: {
        id: user.id,
        phone: user.phone,
        role: user.role,
        onboarding_completed: user.onboarding_completed,
      },
    },
    'OK',
    200
  );
}
