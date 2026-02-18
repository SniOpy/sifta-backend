import dotenv from 'dotenv';
import { NotFoundError, TooManyRequestsError, ValidationError, InternalServerError } from '../../../shared/errors/appError';
import { createOTPForPhone, verifyOTP } from '../../otp/services/otpService';
import { sendOTP } from '../../../services/smsService';
import { findActiveOTP, incrementAttempts, deleteOTPByPhone } from '../../otp/models/otpModel';
import { findOrCreateUser } from '../../user/services/userService';
import { generateTokens } from '../../token/services/tokenService';
import { UserMinimal, TokenPair } from '../types';
import { AuthErrorMessages } from '../constants/errorMessages';

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
   * Demande d'OTP (S05-BE-Correction: role stocké avec l'OTP, source de vérité au verify).
   */
  async requestOTPFlow(phone: string, role: 'seller' | 'courier'): Promise<RequestOTPResult> {
    const code = await createOTPForPhone(phone, role);
    await sendOTP(phone, code);
    return { success: true, message: 'Code OTP envoyé avec succès' };
  }

  /**
   * Vérification OTP (S05-BE-Correction: role pris depuis la session OTP, jamais depuis le body).
   */
  async verifyOTPFlow(phone: string, code: string): Promise<VerifyOTPResult> {
    const otp = await findActiveOTP(phone);
    if (!otp) throw new NotFoundError(AuthErrorMessages.OTP.NOT_FOUND);
    if (otp.attempts >= MAX_OTP_ATTEMPTS) {
      throw new TooManyRequestsError(AuthErrorMessages.OTP.MAX_ATTEMPTS(MAX_OTP_ATTEMPTS));
    }
    const updatedOtp = await incrementAttempts(otp.id);
    if (!updatedOtp) throw new InternalServerError(AuthErrorMessages.OTP.UPDATE_FAILED);
    const isValid = await verifyOTP(code, otp.code_hash);
    if (!isValid) throw new ValidationError(AuthErrorMessages.OTP.INVALID);

    if (!otp.role || (otp.role !== 'seller' && otp.role !== 'courier')) {
      throw new ValidationError('Session OTP invalide: rôle manquant. Refaites la demande OTP en choisissant un rôle.');
    }

    const user = await findOrCreateUser(phone, otp.role);
    const tokens = await generateTokens(user);
    await deleteOTPByPhone(phone);

    return {
      user: {
        id: user.id,
        phone: user.phone,
        role: user.role,
        onboarding_completed: user.onboarding_completed,
      },
      tokens: { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken },
    };
  }
}

// Instance singleton du service
export const authService = new AuthService();
