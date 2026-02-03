import { Request, Response } from 'express';
import dotenv from 'dotenv';
import { RequestOTPResponse, VerifyOTPResponse } from '../types/auth';
import { createOTPForPhone, verifyOTP } from '../services/otpService';
import { sendOTP } from '../services/smsService';
import { findActiveOTP, incrementAttempts, deleteOTPByPhone } from '../models/OTPCode';

dotenv.config();

const MAX_OTP_ATTEMPTS = parseInt(process.env.MAX_OTP_ATTEMPTS || '5', 10);

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

/**
 * Contrôleur pour la vérification d'OTP
 * @param req - Requête Express avec body.phone et body.code (déjà validés et normalisés)
 * @param res - Réponse Express
 */
export async function verifyOTPController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { phone, code } = req.body;

    // 1. Trouver l'OTP actif pour ce téléphone (vérifie déjà l'expiration)
    const otp = await findActiveOTP(phone);

    // 2. Vérifier si l'OTP existe
    if (!otp) {
      res.status(404).json({
        success: false,
        error: 'OTP non trouvé',
        message: 'Aucun code OTP actif trouvé pour ce numéro de téléphone',
      });
      return;
    }

    // 3. Vérifier si l'OTP est expiré (double vérification côté application)
    const now = new Date();
    if (otp.expires_at <= now) {
      res.status(400).json({
        success: false,
        error: 'OTP expiré',
        message: 'Le code OTP a expiré. Veuillez demander un nouveau code',
      });
      return;
    }

    // 4. Vérifier si le nombre de tentatives a été dépassé
    if (otp.attempts >= MAX_OTP_ATTEMPTS) {
      res.status(429).json({
        success: false,
        error: 'Trop de tentatives',
        message: `Le nombre maximum de tentatives (${MAX_OTP_ATTEMPTS}) a été atteint. Veuillez demander un nouveau code OTP`,
      });
      return;
    }

    // 5. Incrémenter le compteur de tentatives
    const updatedOtp = await incrementAttempts(otp.id);
    if (!updatedOtp) {
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur',
        message: 'Une erreur est survenue lors de la vérification du code OTP',
      });
      return;
    }

    // 6. Vérifier le code OTP
    const isValid = await verifyOTP(code, otp.code_hash);

    if (!isValid) {
      // Code incorrect, mais on a déjà incrémenté les tentatives
      res.status(400).json({
        success: false,
        error: 'Code invalide',
        message: 'Le code OTP est incorrect',
      });
      return;
    }

    // 7. Code correct : supprimer l'OTP et retourner succès
    await deleteOTPByPhone(phone);

    const response: VerifyOTPResponse = {
      success: true,
      message: 'Code OTP vérifié avec succès',
    };

    res.status(200).json(response);
  } catch (error: any) {
    console.error('Erreur lors de la vérification d\'OTP:', error);

    // Réponse d'erreur standardisée
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur',
      message: 'Une erreur est survenue lors de la vérification du code OTP',
    });
  }
}
