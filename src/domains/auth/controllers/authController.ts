import { Request, Response } from 'express';
import { authService } from '../services/authService';
import { refreshTokenFlow } from '../../token/services/tokenService';
import { successResponse, errorResponse } from '../../../shared/responses/apiResponse';
import { AppError } from '../../../shared/errors/appError';

/**
 * Contrôleur pour la demande d'OTP
 * @param req - Requête Express avec body.phone (déjà validé et normalisé)
 * @param res - Réponse Express
 */
export async function requestOTP(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { phone } = req.body;

    const result = await authService.requestOTPFlow(phone);

    successResponse(res, { message: result.message }, result.message, 200);
  } catch (error: any) {
    console.error('Erreur lors de la demande d\'OTP:', error);

    if (error instanceof AppError) {
      errorResponse(res, error.name, error.message, error.statusCode);
    } else {
      errorResponse(
        res,
        'Erreur interne du serveur',
        'Une erreur est survenue lors de l\'envoi du code OTP',
        500
      );
    }
  }
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
  try {
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
  } catch (error: any) {
    console.error('Erreur lors de la vérification d\'OTP:', error);
    console.error('Détails de l\'erreur:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      stack: error.stack,
    });

    if (error instanceof AppError) {
      errorResponse(res, error.name, error.message, error.statusCode, error.details);
    } else {
      errorResponse(
        res,
        'Erreur interne du serveur',
        'Une erreur est survenue lors de la vérification du code OTP',
        500,
        process.env.NODE_ENV !== 'production' ? { details: error.message } : undefined
      );
    }
  }
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
  try {
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
  } catch (error: any) {
    console.error('Erreur lors du rafraîchissement de token:', error);
    console.error('Détails de l\'erreur:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      stack: error.stack,
    });

    if (error instanceof AppError) {
      errorResponse(res, error.name, error.message, error.statusCode);
    } else {
      errorResponse(
        res,
        'Erreur interne du serveur',
        'Une erreur est survenue lors du rafraîchissement des tokens',
        500,
        process.env.NODE_ENV !== 'production' ? { details: error.message } : undefined
      );
    }
  }
}
