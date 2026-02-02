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
  // Mock: Log le SMS qui serait envoyé
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('[SMS MOCK] 📱 Envoi SMS');
  console.log(`   Destinataire: ${phone}`);
  console.log(`   Message: Votre code OTP Sokhra est ${code}`);
  console.log(`   Code: ${code}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Simuler un délai d'envoi (optionnel)
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
