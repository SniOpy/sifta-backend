/**
 * Résultat de validation de téléphone
 */
export interface PhoneValidationResult {
  valid: boolean;
  normalized?: string;
  error?: string;
}

/**
 * Regex pour valider le format de téléphone marocain
 * Format attendu: +2126xxxxxxx ou +2127xxxxxxx (10 chiffres après +212)
 */
const PHONE_REGEX = /^\+212[67]\d{8}$/;

/**
 * Valide le format d'un numéro de téléphone marocain
 * @param phone - Numéro de téléphone à valider
 * @returns Résultat de validation avec téléphone normalisé si valide
 */
export function validatePhoneFormat(phone: string): PhoneValidationResult {
  if (!phone || typeof phone !== 'string') {
    return {
      valid: false,
      error: 'Le numéro de téléphone est requis',
    };
  }

  // Normaliser le téléphone (supprimer espaces, tirets, etc.)
  const normalized = normalizePhone(phone);

  // Vérifier le format
  if (!PHONE_REGEX.test(normalized)) {
    return {
      valid: false,
      error: 'Format de téléphone invalide. Format attendu: +2126xxxxxxx ou +2127xxxxxxx',
    };
  }

  return {
    valid: true,
    normalized,
  };
}

/**
 * Normalise un numéro de téléphone
 * Supprime les espaces, tirets, points et autres caractères non numériques sauf le +
 * @param phone - Numéro de téléphone à normaliser
 * @returns Téléphone normalisé
 */
export function normalizePhone(phone: string): string {
  if (!phone) {
    return '';
  }

  // Supprimer tous les caractères sauf les chiffres et le +
  let normalized = phone.replace(/[^\d+]/g, '');

  // Si le téléphone commence par 0, remplacer par +212
  if (normalized.startsWith('0')) {
    normalized = '+212' + normalized.substring(1);
  }

  // Si le téléphone commence par 212 sans +, ajouter le +
  if (normalized.startsWith('212') && !normalized.startsWith('+212')) {
    normalized = '+' + normalized;
  }

  // Si le téléphone commence par 06 ou 07, ajouter +212
  if (normalized.match(/^(06|07)/)) {
    normalized = '+212' + normalized.substring(1);
  }

  return normalized;
}

/**
 * Vérifie si un téléphone est valide
 * @param phone - Numéro de téléphone à vérifier
 * @returns true si valide, false sinon
 */
export function isValidPhone(phone: string): boolean {
  return validatePhoneFormat(phone).valid;
}
