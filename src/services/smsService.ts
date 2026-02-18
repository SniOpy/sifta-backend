/**
 * Service SMS (Mock pour le développement)
 * 
 * Ce service simule l'envoi de SMS pour le développement.
 * Pour la production, remplacer par un vrai provider SMS (Twilio, AWS SNS, etc.)
 */

/**
 * Envoie un code OTP par SMS (mock)
 * @param phone - Numéro de téléphone destinataire
 * @param code - Code OTP à envoyer
 * @returns Promise résolue (simule envoi asynchrone)
 */
export async function sendOTP(phone: string, code: string): Promise<void> {
  // DEV ONLY : afficher le code en console si DEV_SHOW_OTP=true (pour tester sans vrai SMS)
  if (process.env.DEV_SHOW_OTP === 'true') {
    console.log(`[DEV] Code OTP pour ${phone} : ${code}`);
  }
  await new Promise((resolve) => setTimeout(resolve, 100));

  // En production, remplacer par:
  // - Appel API Twilio
  // - Appel AWS SNS
  // - Appel autre provider SMS
}

/**
 * Interface pour un provider SMS réel (à implémenter plus tard)
 */
export interface SMSProvider {
  sendOTP(phone: string, code: string): Promise<void>;
}
