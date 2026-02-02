import { Request, Response } from 'express';
import { RequestOTPResponse } from '../types/auth';
import { createOTPForPhone } from '../services/otpService';
import { sendOTP } from '../services/smsService';

/**
 * Contrôleur pour la demande d'OTP
 * @param req - Requête Express avec body.phone (déjà validé et normalisé)
 * @param res - Réponse Express
 */
export async function requestOTP(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { phone } = req.body;

    // Créer l'OTP pour ce téléphone
    // Cette fonction supprime automatiquement les OTP actifs existants
    const code = await createOTPForPhone(phone);

    // Envoyer le SMS (mock pour l'instant)
    await sendOTP(phone, code);

    // Réponse de succès (sans révéler le code)
    const response: RequestOTPResponse = {
      success: true,
      message: 'Code OTP envoyé avec succès',
    };

    res.status(200).json(response);
  } catch (error: any) {
    console.error('Erreur lors de la demande d\'OTP:', error);

    // Réponse d'erreur standardisée
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur',
      message: 'Une erreur est survenue lors de l\'envoi du code OTP',
    });
  }
}
