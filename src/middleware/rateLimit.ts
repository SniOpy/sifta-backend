import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

dotenv.config();

const OTP_RATE_LIMIT_MAX = parseInt(process.env.OTP_RATE_LIMIT_MAX || '3', 10);
const OTP_RATE_LIMIT_WINDOW_MS = parseInt(
  process.env.OTP_RATE_LIMIT_WINDOW_MS || '60000',
  10
);

/**
 * Rate limiter spécifique pour l'endpoint request-otp
 * Limite les demandes par téléphone pour éviter les abus
 */
export const otpRateLimit = rateLimit({
  windowMs: OTP_RATE_LIMIT_WINDOW_MS, // Fenêtre de temps (1 minute par défaut)
  max: OTP_RATE_LIMIT_MAX, // Nombre maximum de requêtes par fenêtre
  message: {
    success: false,
    error: 'Trop de demandes',
    message: 'Veuillez patienter avant de redemander un code',
  },
  standardHeaders: true, // Retourne les headers `RateLimit-*` dans la réponse
  legacyHeaders: false, // Désactive les headers `X-RateLimit-*`
  // Key generator basé sur le numéro de téléphone
  keyGenerator: (req) => {
    // Utiliser le téléphone du body comme clé pour le rate limiting
    return req.body?.phone || req.ip || 'unknown';
  },
  // Skip si le téléphone n'est pas valide (pour éviter de bloquer sur erreurs de validation)
  skip: (req) => {
    // Ne pas appliquer le rate limit si le téléphone n'est pas présent ou invalide
    // La validation se fera après le rate limiting
    return !req.body?.phone;
  },
});
