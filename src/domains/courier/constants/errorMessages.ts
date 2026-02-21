/**
 * Messages d'erreur centralisés pour le domaine courier
 */

export const CourierErrorMessages = {
  /**
   * Messages d'erreur liés à l'autorisation
   */
  AUTH: {
    NOT_ADMIN: 'Vous n\'êtes pas autorisé à effectuer cette action. Accès admin requis.',
    NOT_OWNER_OR_ADMIN: 'Accès refusé. Réservé au livreur concerné ou à un admin.',
  },

  /**
   * Messages d'erreur liés à la validation
   */
  VALIDATION: {
    COURIER_ID_INVALID: 'L\'identifiant du livreur doit être un UUID valide',
    LAT_REQUIRED: 'La latitude (lat) est requise',
    LNG_REQUIRED: 'La longitude (lng) est requise',
    LAT_INVALID: 'La latitude doit être un nombre entre -90 et 90',
    LNG_INVALID: 'La longitude doit être un nombre entre -180 et 180',
  },
};
