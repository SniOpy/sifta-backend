import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../shared/errors/appError';

/**
 * Middleware d'autorisation admin
 * 
 * Vérifie que l'utilisateur authentifié est dans la liste des administrateurs
 * La liste des admins est définie dans la variable d'environnement ADMIN_USER_IDS
 * Format : ADMIN_USER_IDS=uuid1,uuid2,uuid3 (virgule séparée)
 * 
 * Doit être utilisé APRÈS authenticateJWT
 * 
 * @param req - Requête Express avec req.user injecté par authenticateJWT
 * @param res - Réponse Express
 * @param next - Fonction next d'Express
 * @throws ForbiddenError si l'utilisateur n'est pas admin
 * 
 * @example
 * router.post('/admin-only', authenticateJWT, authorizeAdmin, (req, res) => {
 *   // Seuls les admins peuvent accéder ici
 * });
 */
export function authorizeAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Vérifier que l'utilisateur est authentifié (doit être fait avant ce middleware)
  if (!req.user) {
    throw new ForbiddenError('Vous devez être authentifié pour accéder à cette ressource');
  }

  // Récupérer la liste des IDs admin depuis les variables d'environnement
  const adminUserIds = process.env.ADMIN_USER_IDS || '';
  
  // Si aucune liste admin n'est configurée, refuser l'accès par sécurité
  if (!adminUserIds || adminUserIds.trim() === '') {
    throw new ForbiddenError('Accès admin non configuré');
  }

  // Parser la liste (format : "uuid1,uuid2,uuid3")
  const adminIds = adminUserIds
    .split(',')
    .map(id => id.trim())
    .filter(id => id.length > 0);

  // Vérifier si l'utilisateur est dans la liste des admins
  const userId = req.user.id;
  const isAdmin = adminIds.includes(userId);

  if (!isAdmin) {
    throw new ForbiddenError('Vous n\'êtes pas autorisé à effectuer cette action. Accès admin requis.');
  }

  // L'utilisateur est admin, continuer
  next();
}
