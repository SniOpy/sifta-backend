import { Request, Response } from 'express';
import { getUserById } from '../services/userService';
import { successResponse } from '../../../shared/responses/apiResponse';
import { UnauthorizedError, NotFoundError } from '../../../shared/errors/appError';

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
    throw new UnauthorizedError('Utilisateur non authentifié');
  }

  // Charger l'utilisateur complet depuis la DB pour obtenir created_at et updated_at réels
  const user = await getUserById(req.user.id);

  if (!user) {
    throw new NotFoundError('Utilisateur non trouvé');
  }

  // Retourner les informations utilisateur complètes
  successResponse(
    res,
    {
      user: {
        id: user.id,
        phone: user.phone,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
    },
    'Informations utilisateur récupérées avec succès',
    200
  );
}
