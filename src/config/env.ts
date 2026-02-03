/**
 * Validation des variables d'environnement requises
 * Vérifie que toutes les variables essentielles sont définies au démarrage
 */

interface RequiredEnvVars {
  JWT_SECRET: string;
  DB_HOST: string;
  DB_PORT: string;
  DB_NAME: string;
  DB_USER: string;
  DB_PASSWORD: string;
}

/**
 * Liste des variables d'environnement requises
 */
const REQUIRED_ENV_VARS: (keyof RequiredEnvVars)[] = [
  'JWT_SECRET',
  'DB_HOST',
  'DB_PORT',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD',
];

/**
 * Valide que toutes les variables d'environnement requises sont définies
 * @throws Error si des variables manquent
 */
export function validateEnv(): void {
  const missing: string[] = [];

  for (const key of REQUIRED_ENV_VARS) {
    if (!process.env[key] || process.env[key]?.trim() === '') {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Variables d'environnement manquantes: ${missing.join(', ')}\n` +
        'Veuillez définir ces variables dans votre fichier .env\n' +
        'Consultez .env.example pour un exemple de configuration.'
    );
  }
}
