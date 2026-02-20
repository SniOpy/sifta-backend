import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../domains/token/services/tokenService';
import { UnauthorizedError } from '../shared/errors/appError';
import { UserMinimal } from '../domains/auth/types';
import { AuthErrorMessages } from '../domains/auth/constants/errorMessages';

/**
 * Middleware d'authentification JWT
 * 
 * Extrait et vérifie le token JWT depuis le header Authorization,
 * puis injecte les données utilisateur dans req.user
 * 
 * @param req - Requête Express
 * @param res - Réponse Express
 * @param next - Fonction next d'Express
 * @throws UnauthorizedError si le token est manquant, invalide ou expiré
 * 
 * @example
 * router.get('/protected', authenticateJWT, (req, res) => {
 *   // req.user est maintenant disponible et typé
 *   res.json({ user: req.user });
 * });
 */
export async function authenticateJWT(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return next(new UnauthorizedError(AuthErrorMessages.TOKEN.REQUIRED));
    }
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return next(new UnauthorizedError(AuthErrorMessages.TOKEN.INVALID_FORMAT));
    }
    const token = parts[1];
    const payload = verifyAccessToken(token);
    if (!payload) {
      return next(new UnauthorizedError(AuthErrorMessages.TOKEN.INVALID_OR_EXPIRED));
    }
    req.user = {
      id: payload.sub,
      phone: payload.phone,
      role: payload.role ?? null,
      onboarding_completed: payload.onboarding_completed ?? false,
      is_admin: payload.is_admin ?? false,
    };
    next();
  } catch (err) {
    next(err);
  }
}
