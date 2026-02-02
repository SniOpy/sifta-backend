import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

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
  // Erreurs de validation express-validator
  const validationErrors = validationResult(req);
  if (!validationErrors.isEmpty()) {
    const formattedErrors: Record<string, string> = {};
    validationErrors.array().forEach((error: any) => {
      if (error.type === 'field') {
        formattedErrors[error.path] = error.msg;
      }
    });

    res.status(400).json({
      success: false,
      error: 'Validation error',
      details: formattedErrors,
    });
    return;
  }

  // Erreurs générales
  console.error('Erreur:', err);

  const statusCode = err.statusCode || err.status || 500;
  const message =
    err.message || 'Une erreur est survenue lors du traitement de votre demande';

  res.status(statusCode).json({
    success: false,
    error: statusCode === 500 ? 'Erreur interne du serveur' : err.name || 'Error',
    message: statusCode === 500 ? 'Une erreur est survenue' : message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
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
