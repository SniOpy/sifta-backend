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
  // 1. Extraire le header Authorization
  const authHeader = req.headers.authorization;

  // 2. Vérifier la présence du header
  if (!authHeader) {
    throw new UnauthorizedError(AuthErrorMessages.TOKEN.REQUIRED);
  }

  // 3. Vérifier le format "Bearer <token>"
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    throw new UnauthorizedError(AuthErrorMessages.TOKEN.INVALID_FORMAT);
  }

  // 4. Extraire le token
  const token = parts[1];

  // 5. Vérifier et décoder le token JWT
  const payload = verifyAccessToken(token);

  // 6. Si le token est invalide ou expiré
  if (!payload) {
    throw new UnauthorizedError(AuthErrorMessages.TOKEN.INVALID_OR_EXPIRED);
  }

  // 7. UserMinimal depuis le payload (S05-BE-Correction: role pour requireRole)
  req.user = {
    id: payload.sub,
    phone: payload.phone,
    role: payload.role ?? null,
    onboarding_completed: payload.onboarding_completed ?? false,
  };

  // 8. Continuer vers le prochain middleware/contrôleur
  next();
}
