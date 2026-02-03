/**
 * Messages d'erreur centralisés pour le domaine d'authentification
 * Assure la cohérence et la normalisation des messages d'erreur
 */

export const AuthErrorMessages = {
  /**
   * Messages d'erreur liés aux codes OTP
   */
  OTP: {
    NOT_FOUND: 'Aucun code OTP actif trouvé pour ce numéro de téléphone',
    EXPIRED: 'Le code OTP a expiré. Veuillez demander un nouveau code',
    INVALID: 'Le code OTP est incorrect',
    MAX_ATTEMPTS: (max: number): string =>
      `Le nombre maximum de tentatives (${max}) a été atteint. Veuillez demander un nouveau code OTP`,
    UPDATE_FAILED: 'Erreur lors de la mise à jour des tentatives OTP',
  },

  /**
   * Messages d'erreur liés aux tokens JWT
   */
  TOKEN: {
    REQUIRED: 'Token d\'authentification requis',
    INVALID_FORMAT: 'Format de token invalide. Utilisez: Bearer <token>',
    INVALID_OR_EXPIRED: 'Token invalide ou expiré',
    REFRESH_INVALID: 'Refresh token invalide ou expiré',
    REFRESH_USED:
      'Ce refresh token a déjà été utilisé. Veuillez utiliser le nouveau refresh token reçu lors du dernier rafraîchissement.',
    REFRESH_EXPIRED: 'Refresh token expiré. Veuillez vous ré-authentifier.',
    JWT_SECRET_MISSING:
      'JWT_SECRET n\'est pas défini dans les variables d\'environnement. Veuillez définir JWT_SECRET dans votre fichier .env',
  },

  /**
   * Messages d'erreur liés aux utilisateurs
   */
  USER: {
    NOT_AUTHENTICATED: 'Utilisateur non authentifié',
    NOT_FOUND: 'Utilisateur non trouvé',
    REFRESH_TOKEN_USER_NOT_FOUND: 'Utilisateur associé au refresh token non trouvé',
  },
};
