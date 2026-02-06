import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

dotenv.config();

const OTP_RATE_LIMIT_MAX = parseInt(process.env.OTP_RATE_LIMIT_MAX || '3', 10);
const OTP_RATE_LIMIT_WINDOW_MS = parseInt(
  process.env.OTP_RATE_LIMIT_WINDOW_MS || '60000',
  10
);

const TRIP_CREATION_RATE_LIMIT_MAX = parseInt(process.env.TRIP_CREATION_RATE_LIMIT_MAX || '10', 10);
const TRIP_CANCELLATION_RATE_LIMIT_MAX = parseInt(process.env.TRIP_CANCELLATION_RATE_LIMIT_MAX || '5', 10);

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

/**
 * Rate limiter pour la création de trajets
 * Limite les créations par utilisateur authentifié pour éviter les abus
 */
export const tripCreationRateLimit = rateLimit({
  windowMs: 60000, // 1 minute
  max: TRIP_CREATION_RATE_LIMIT_MAX, // 10 créations par minute par défaut
  message: {
    success: false,
    error: 'Trop de demandes',
    message: 'Veuillez patienter avant de créer un nouveau trajet',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Key generator basé sur l'ID utilisateur (req.user injecté par authenticateJWT)
  keyGenerator: (req) => {
    return (req as any).user?.id || req.ip || 'unknown';
  },
  // Skip si l'utilisateur n'est pas authentifié (le middleware authenticateJWT gérera cela)
  skip: (req) => {
    return !(req as any).user;
  },
});

/**
 * Rate limiter pour l'annulation de trajets
 * Limite les annulations par utilisateur authentifié pour éviter les abus
 */
export const tripCancellationRateLimit = rateLimit({
  windowMs: 3600000, // 1 heure
  max: TRIP_CANCELLATION_RATE_LIMIT_MAX, // 5 annulations par heure par défaut
  message: {
    success: false,
    error: 'Trop de demandes',
    message: 'Veuillez patienter avant d\'annuler un autre trajet',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Key generator basé sur l'ID utilisateur
  keyGenerator: (req) => {
    return (req as any).user?.id || req.ip || 'unknown';
  },
  // Skip si l'utilisateur n'est pas authentifié
  skip: (req) => {
    return !(req as any).user;
  },
});
