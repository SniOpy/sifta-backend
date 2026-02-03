import { deleteExpiredOTPs } from '../../domains/otp/models/otpModel';
import { logInfo, logError } from './logger';

/**
 * Exécute le nettoyage des OTP expirés
 * @returns Nombre d'OTP supprimés
 */
async function runOTPCleanup(): Promise<number> {
  try {
    const deletedCount = await deleteExpiredOTPs();
    if (deletedCount > 0) {
      logInfo('OTP Cleanup', `Supprimé ${deletedCount} OTP expiré(s)`);
    }
    return deletedCount;
  } catch (error) {
    logError('OTP Cleanup', error);
    return 0;
  }
}

/**
 * Démarre le job de nettoyage périodique des OTP expirés
 * @param intervalMinutes - Intervalle en minutes entre chaque nettoyage (défaut: 60)
 */
export function startOTPCleanupJob(intervalMinutes: number = 60): void {
  // Exécuter immédiatement au démarrage
  runOTPCleanup();

  // Puis exécuter périodiquement
  const intervalMs = intervalMinutes * 60 * 1000;
  setInterval(() => {
    runOTPCleanup();
  }, intervalMs);

  logInfo(
    'OTP Cleanup Job',
    `Job de nettoyage OTP démarré avec un intervalle de ${intervalMinutes} minutes`
  );
}
