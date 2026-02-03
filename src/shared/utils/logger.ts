/**
 * Logger standardisé pour l'application
 */

interface LogContext {
  [key: string]: any;
}

/**
 * Log une erreur avec contexte
 * @param context - Contexte de l'erreur (ex: "demande d'OTP", "vérification OTP")
 * @param error - Erreur à logger
 * @param additionalDetails - Détails supplémentaires optionnels
 */
export function logError(
  context: string,
  error: any,
  additionalDetails?: Record<string, any>
): void {
  const errorDetails: Record<string, any> = {
    context,
    message: error?.message || 'Erreur inconnue',
    ...(error?.code && { code: error.code }),
    ...(error?.detail && { detail: error.detail }),
    ...(error?.stack && process.env.NODE_ENV === 'development' && { stack: error.stack }),
    ...additionalDetails,
  };

  console.error(`[ERROR] ${context}:`, errorDetails);
}

/**
 * Log un warning avec contexte
 * @param context - Contexte du warning
 * @param message - Message du warning
 * @param details - Détails optionnels
 */
export function logWarning(
  context: string,
  message: string,
  details?: Record<string, any>
): void {
  console.warn(`[WARN] ${context}:`, { message, ...details });
}

/**
 * Log une information avec contexte
 * @param context - Contexte de l'information
 * @param message - Message informatif
 * @param details - Détails optionnels
 */
export function logInfo(
  context: string,
  message: string,
  details?: Record<string, any>
): void {
  console.log(`[INFO] ${context}:`, { message, ...details });
}

/**
 * Log pour le débogage (uniquement en développement)
 * @param context - Contexte du debug
 * @param message - Message de debug
 * @param details - Détails optionnels
 */
export function logDebug(
  context: string,
  message: string,
  details?: Record<string, any>
): void {
  if (process.env.NODE_ENV === 'development') {
    console.debug(`[DEBUG] ${context}:`, { message, ...details });
  }
}
