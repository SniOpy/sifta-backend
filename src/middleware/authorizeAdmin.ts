import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../shared/errors/appError';

/**
 * Middleware requireAdmin: 403 si l'utilisateur n'est pas admin (users.is_admin).
 * À placer après authenticateJWT.
 */
export function requireAdmin(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    throw new ForbiddenError('Vous devez être authentifié pour accéder à cette ressource');
  }
  if (!req.user.is_admin) {
    throw new ForbiddenError('Accès admin requis.');
  }
  next();
}

/** Alias pour compatibilité avec les imports existants (authorizeAdmin). */
export const authorizeAdmin = requireAdmin;
