import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../types/auth';
import {
  saveRefreshToken,
  hashRefreshToken,
  findRefreshToken,
} from '../models/RefreshToken';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

/**
 * Vérifie que JWT_SECRET est configuré
 * @throws Error si JWT_SECRET n'est pas défini
 */
function ensureJWTSecret(): void {
  if (!JWT_SECRET) {
    throw new Error(
      'JWT_SECRET n\'est pas défini dans les variables d\'environnement. ' +
        'Veuillez définir JWT_SECRET dans votre fichier .env'
    );
  }
}

/**
 * Convertit une durée en secondes (ex: "15m" -> 900, "7d" -> 604800)
 * @param expiresIn - Durée au format string (ex: "15m", "1h", "7d")
 * @returns Durée en secondes
 */
function parseExpiresIn(expiresIn: string): number {
  const unit = expiresIn.slice(-1);
  const value = parseInt(expiresIn.slice(0, -1), 10);

  switch (unit) {
    case 's':
      return value;
    case 'm':
      return value * 60;
    case 'h':
      return value * 60 * 60;
    case 'd':
      return value * 24 * 60 * 60;
    default:
      throw new Error(`Format d'expiration invalide: ${expiresIn}`);
  }
}

/**
 * Calcule la date d'expiration à partir d'une durée
 * @param expiresIn - Durée au format string (ex: "15m", "7d")
 * @returns Date d'expiration
 */
function calculateExpiresAt(expiresIn: string): Date {
  const seconds = parseExpiresIn(expiresIn);
  const expiresAt = new Date();
  expiresAt.setSeconds(expiresAt.getSeconds() + seconds);
  return expiresAt;
}

/**
 * Génère un Access Token JWT avec payload standardisé
 * @param user - Utilisateur pour lequel générer le token
 * @returns Access Token JWT
 */
export function generateAccessToken(user: User): string {
  ensureJWTSecret();

  const payload = {
    sub: user.id, // Subject (user ID)
    phone: user.phone, // Numéro de téléphone
  };

  return jwt.sign(payload, JWT_SECRET!, {
    expiresIn: JWT_ACCESS_EXPIRES_IN,
  });
}

/**
 * Génère un Refresh Token (UUID v4)
 * @returns Refresh Token en clair
 */
export function generateRefreshToken(): string {
  return uuidv4();
}

/**
 * Génère une paire de tokens (Access Token + Refresh Token)
 * et sauvegarde le refresh token hashé en base de données
 * @param user - Utilisateur pour lequel générer les tokens
 * @returns Paire de tokens {accessToken, refreshToken}
 */
export async function generateTokens(user: User): Promise<{
  accessToken: string;
  refreshToken: string;
}> {
  ensureJWTSecret();

  // Générer les tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken();

  // Hash le refresh token
  const tokenHash = await hashRefreshToken(refreshToken);

  // Calculer la date d'expiration du refresh token
  const expiresAt = calculateExpiresAt(JWT_REFRESH_EXPIRES_IN);

  // Sauvegarder le refresh token hashé en base
  await saveRefreshToken(user.id, tokenHash, expiresAt);

  return {
    accessToken,
    refreshToken,
  };
}

/**
 * Vérifie et décode un Access Token JWT
 * @param token - Access Token à vérifier
 * @returns Payload décodé ou null si invalide
 */
export function verifyAccessToken(token: string): {
  sub: string;
  phone: string;
  iat: number;
  exp: number;
} | null {
  ensureJWTSecret();

  try {
    const decoded = jwt.verify(token, JWT_SECRET!) as {
      sub: string;
      phone: string;
      iat: number;
      exp: number;
    };
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Vérifie un Refresh Token en base de données
 * @param userId - ID de l'utilisateur
 * @param token - Refresh Token à vérifier
 * @returns true si le token est valide, false sinon
 */
export async function verifyRefreshToken(
  userId: string,
  token: string
): Promise<boolean> {
  const refreshToken = await findRefreshToken(userId, token);
  return refreshToken !== null;
}
