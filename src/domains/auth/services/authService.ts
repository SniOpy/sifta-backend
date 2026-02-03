import dotenv from 'dotenv';
import { NotFoundError, TooManyRequestsError, ValidationError } from '../../../shared/errors/appError';
import { createOTPForPhone, verifyOTP } from '../../otp/services/otpService';
import { sendOTP } from '../../../services/smsService';
import { findActiveOTP, incrementAttempts, deleteOTPByPhone } from '../../otp/models/otpModel';
import { findOrCreateUser } from '../../user/services/userService';
import { generateTokens } from '../../token/services/tokenService';
import { UserMinimal, TokenPair } from '../types';

dotenv.config();

const MAX_OTP_ATTEMPTS = parseInt(process.env.MAX_OTP_ATTEMPTS || '5', 10);

/**
 * Résultat de la demande d'OTP
 */
export interface RequestOTPResult {
  success: boolean;
  message: string;
}

/**
 * Résultat de la vérification d'OTP
 */
export interface VerifyOTPResult {
  user: UserMinimal;
  tokens: TokenPair;
}

/**
 * Service d'authentification - Orchestre les flux d'authentification
 */
export class AuthService {
  /**
   * Orchestre le flux de demande d'OTP
   * @param phone - Numéro de téléphone (déjà validé et normalisé)
   * @returns Résultat de la demande
   */
  async requestOTPFlow(phone: string): Promise<RequestOTPResult> {
    // Créer l'OTP pour ce téléphone
    // Cette fonction supprime automatiquement les OTP actifs existants
    const code = await createOTPForPhone(phone);

    // Envoyer le SMS (mock pour l'instant)
    await sendOTP(phone, code);

    return {
      success: true,
      message: 'Code OTP envoyé avec succès',
    };
  }

  /**
   * Orchestre le flux de vérification d'OTP
   * @param phone - Numéro de téléphone (déjà validé et normalisé)
   * @param code - Code OTP à vérifier
   * @returns Résultat avec utilisateur et tokens
   * @throws NotFoundError si OTP non trouvé
   * @throws ValidationError si OTP expiré ou code invalide
   * @throws TooManyRequestsError si trop de tentatives
   */
  async verifyOTPFlow(phone: string, code: string): Promise<VerifyOTPResult> {
    // 1. Trouver l'OTP actif pour ce téléphone (vérifie déjà l'expiration)
    const otp = await findActiveOTP(phone);

    // 2. Vérifier si l'OTP existe
    if (!otp) {
      throw new NotFoundError('Aucun code OTP actif trouvé pour ce numéro de téléphone');
    }

    // 3. Vérifier si l'OTP est expiré (double vérification côté application)
    const now = new Date();
    if (otp.expires_at <= now) {
      throw new ValidationError('Le code OTP a expiré. Veuillez demander un nouveau code');
    }

    // 4. Vérifier si le nombre de tentatives a été dépassé
    if (otp.attempts >= MAX_OTP_ATTEMPTS) {
      throw new TooManyRequestsError(
        `Le nombre maximum de tentatives (${MAX_OTP_ATTEMPTS}) a été atteint. Veuillez demander un nouveau code OTP`
      );
    }

    // 5. Incrémenter le compteur de tentatives
    const updatedOtp = await incrementAttempts(otp.id);
    if (!updatedOtp) {
      throw new Error('Erreur lors de la mise à jour des tentatives OTP');
    }

    // 6. Vérifier le code OTP
    const isValid = await verifyOTP(code, otp.code_hash);

    if (!isValid) {
      // Code incorrect, mais on a déjà incrémenté les tentatives
      throw new ValidationError('Le code OTP est incorrect');
    }

    // 7. Code correct : créer ou trouver l'utilisateur
    const user = await findOrCreateUser(phone);

    // 8. Générer les tokens JWT (Access Token + Refresh Token)
    const tokens = await generateTokens(user);

    // 9. Supprimer l'OTP après succès
    await deleteOTPByPhone(phone);

    // 10. Retourner résultat avec données utilisateur minimales et tokens
    return {
      user: {
        id: user.id,
        phone: user.phone,
        created_at: user.created_at,
      },
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    };
  }
}

// Instance singleton du service
export const authService = new AuthService();
