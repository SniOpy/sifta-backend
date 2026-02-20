import { Response } from 'express';

/**
 * Format de réponse API standardisé pour succès
 * @param res - Objet Response Express
 * @param data - Données à retourner
 * @param message - Message de succès
 * @param statusCode - Code HTTP (défaut: 200)
 */
export function successResponse<T>(
  res: Response,
  data: T,
  message: string = 'Opération réussie',
  statusCode: number = 200
): void {
  res.status(statusCode).json({
    success: true,
    message,
    data,
    error: null,
  });
}

/**
 * Format de réponse API standardisé pour erreur (error: { code, message }).
 * @param res - Objet Response Express
 * @param code - Code d'erreur (ex. ValidationError, ForbiddenError)
 * @param message - Message d'erreur
 * @param statusCode - Code HTTP (défaut: 500)
 * @param details - Détails optionnels (ex. champs de validation)
 */
export function errorResponse(
  res: Response,
  code: string,
  message: string,
  statusCode: number = 500,
  details?: Record<string, any>
): void {
  const response: any = {
    success: false,
    data: null,
    error: { code, message },
  };
  if (details) {
    response.details = details;
  }
  if (process.env.NODE_ENV === 'development' && details?.stack) {
    response.stack = details.stack;
  }
  res.status(statusCode).json(response);
}

/**
 * Format de réponse API standardisé pour validation
 * @param res - Objet Response Express
 * @param errors - Erreurs de validation formatées
 */
export function validationErrorResponse(
  res: Response,
  errors: Record<string, string>
): void {
  errorResponse(res, 'ValidationError', 'Erreurs de validation', 400, errors);
}
