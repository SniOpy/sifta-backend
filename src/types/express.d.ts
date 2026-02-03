import { UserMinimal } from '../domains/auth/types';

/**
 * Extension de l'interface Request d'Express pour ajouter req.user
 * Permet l'accès typé à req.user dans les contrôleurs après authentification JWT
 */
declare global {
  namespace Express {
    interface Request {
      /**
       * Utilisateur authentifié (injecté par le middleware authenticateJWT)
       * Contient les données minimales extraites du payload JWT
       */
      user?: UserMinimal;
    }
  }
}

export {};
