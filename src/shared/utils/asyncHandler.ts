import { Request, Response, NextFunction } from 'express';

/**
 * Type pour une fonction de contrôleur async
 */
type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void>;

/**
 * Wrapper pour les contrôleurs async Express
 * Capture automatiquement les erreurs et les passe au middleware errorHandler
 * 
 * @param fn - Fonction de contrôleur async
 * @returns Middleware Express qui gère les erreurs automatiquement
 * 
 * @example
 * router.get('/route', asyncHandler(async (req, res) => {
 *   const data = await someAsyncOperation();
 *   successResponse(res, data);
 * }));
 */
export function asyncHandler(fn: AsyncRequestHandler) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
