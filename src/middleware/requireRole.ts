import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../shared/errors/appError';

export type AllowedRole = 'seller' | 'courier';

/**
 * Bloque si req.user.role ne correspond pas au rôle requis (S05-BE-Correction).
 * À placer après authenticateJWT.
 */
export function requireRole(role: AllowedRole) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new ForbiddenError('Non authentifié'));
      return;
    }
    if (req.user.role !== role) {
      next(new ForbiddenError(`Accès réservé aux ${role === 'seller' ? 'vendeurs' : 'livreurs'}`));
      return;
    }
    next();
  };
}
