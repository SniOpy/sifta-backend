import { Request, Response, NextFunction } from 'express';
import { AppError } from '../shared/errors/appError';
import { errorResponse } from '../shared/responses/apiResponse';
import { logError } from '../shared/utils/logger';

/**
 * Middleware de gestion d'erreurs global
 * Formate toutes les erreurs en réponses JSON standardisées
 */
export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Erreurs AppError personnalisées
  if (err instanceof AppError) {
    // Logger uniquement les erreurs serveur (500) ou en développement
    if (err.statusCode >= 500 || process.env.NODE_ENV === 'development') {
      logError(`Route ${req.method} ${req.path}`, err, {
        statusCode: err.statusCode,
      });
    }

    errorResponse(
      res,
      err.name || 'AppError',
      err.message,
      err.statusCode,
      err instanceof Error && 'details' in err ? (err as any).details : undefined
    );
    return;
  }

  // Erreurs générales non capturées
  logError(`Route ${req.method} ${req.path}`, err, {
    url: req.url,
    method: req.method,
  });

  const statusCode = err.statusCode || err.status || 500;
  const message =
    err.message || 'Une erreur est survenue lors du traitement de votre demande';

  errorResponse(
    res,
    statusCode === 500 ? 'InternalServerError' : (err.name || 'Error'),
    statusCode === 500 ? 'Une erreur est survenue' : message,
    statusCode,
    process.env.NODE_ENV === 'development' ? { stack: err.stack } : undefined
  );
}

/**
 * Middleware pour gérer les routes non trouvées (404)
 */
export function notFoundHandler(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  res.status(404).json({
    success: false,
    data: null,
    error: {
      code: 'NotFound',
      message: `La route ${req.method} ${req.path} n'existe pas`,
    },
  });
}
