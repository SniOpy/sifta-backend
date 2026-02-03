import { Request, Response } from 'express';
import { authService } from '../services/authService';
import { refreshTokenFlow } from '../../token/services/tokenService';
import { successResponse } from '../../../shared/responses/apiResponse';
import { UnauthorizedError } from '../../../shared/errors/appError';
import { revokeAllUserTokens } from '../../token/models/refreshTokenModel';
import { AuthErrorMessages } from '../constants/errorMessages';

/**
 * Contrôleur pour la demande d'OTP
 * @param req - Requête Express avec body.phone (déjà validé et normalisé)
 * @param res - Réponse Express
 */
export async function requestOTP(
  req: Request,
  res: Response
): Promise<void> {
  const { phone } = req.body;

  const result = await authService.requestOTPFlow(phone);

  successResponse(res, { message: result.message }, result.message, 200);
}

/**
 * Contrôleur pour la vérification d'OTP
 * @param req - Requête Express avec body.phone et body.code (déjà validés et normalisés)
 * @param res - Réponse Express
 */
export async function verifyOTPController(
  req: Request,
  res: Response
): Promise<void> {
  const { phone, code } = req.body;

  const result = await authService.verifyOTPFlow(phone, code);

  successResponse(
    res,
    {
      user: result.user,
      tokens: result.tokens,
    },
    'Code OTP vérifié avec succès',
    200
  );
}

/**
 * Contrôleur pour le rafraîchissement de token
 * @param req - Requête Express avec body.refreshToken (déjà validé)
 * @param res - Réponse Express
 */
export async function refreshTokenController(
  req: Request,
  res: Response
): Promise<void> {
  const { refreshToken } = req.body;

  const tokens = await refreshTokenFlow(refreshToken);

  successResponse(
    res,
    {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    },
    'Tokens rafraîchis avec succès',
    200
  );
}

/**
 * Contrôleur pour obtenir les informations de l'utilisateur authentifié
 * Route protégée nécessitant un token JWT valide
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

  successResponse(
    res,
    {
      user: req.user,
    },
    'Informations utilisateur récupérées avec succès',
    200
  );
}

/**
 * Contrôleur pour la déconnexion (logout)
 * Route protégée nécessitant un token JWT valide
 * Révoque tous les refresh tokens de l'utilisateur, invalidant sa session sur tous les appareils
 * 
 * @param req - Requête Express avec req.user injecté par authenticateJWT
 * @param res - Réponse Express
 */
export async function logoutController(
  req: Request,
  res: Response
): Promise<void> {
  // req.user est garanti d'exister grâce au middleware authenticateJWT
  if (!req.user) {
    throw new UnauthorizedError(AuthErrorMessages.USER.NOT_AUTHENTICATED);
  }

  // Révoquer tous les refresh tokens de l'utilisateur
  const revokedCount = await revokeAllUserTokens(req.user.id);

  successResponse(
    res,
    {},
    'Déconnexion réussie. Tous les tokens ont été révoqués.',
    200
  );
}
