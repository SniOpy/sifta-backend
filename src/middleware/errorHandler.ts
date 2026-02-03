import { Request, Response, NextFunction } from 'express';
import { AppError } from '../shared/errors/appError';
import { errorResponse } from '../shared/responses/apiResponse';

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
    errorResponse(
      res,
      err.name,
      err.message,
      err.statusCode,
      err instanceof Error && 'details' in err ? (err as any).details : undefined
    );
    return;
  }

  // Erreurs générales
  console.error('Erreur:', err);

  const statusCode = err.statusCode || err.status || 500;
  const message =
    err.message || 'Une erreur est survenue lors du traitement de votre demande';

  errorResponse(
    res,
    statusCode === 500 ? 'Erreur interne du serveur' : err.name || 'Error',
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
    error: 'Route non trouvée',
    message: `La route ${req.method} ${req.path} n'existe pas`,
  });
}
