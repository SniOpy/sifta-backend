import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'sokhra_db',
  user: process.env.DB_USER || 'sokhra_user',
  password: process.env.DB_PASSWORD || 'MadapesAgencyCreation',
};

const pool = new Pool(dbConfig);

/**
 * Analyse l'erreur PostgreSQL et retourne des suggestions de résolution
 */
function getErrorSuggestions(error: any): string[] {
  const suggestions: string[] = [];
  const errorMessage = error?.message || '';
  const errorCode = error?.code || '';

  if (errorCode === 'ECONNREFUSED') {
    suggestions.push('Vérifiez que PostgreSQL est démarré : sudo service postgresql start (Linux) ou brew services start postgresql (macOS)');
    suggestions.push(`Vérifiez que PostgreSQL écoute sur ${dbConfig.host}:${dbConfig.port}`);
  } else if (errorMessage.includes('database') && errorMessage.includes('does not exist')) {
    suggestions.push(`La base de données "${dbConfig.database}" n'existe pas`);
    suggestions.push(`Créez-la avec : CREATE DATABASE ${dbConfig.database};`);
    suggestions.push('Ou utilisez le script : npm run db:init');
  } else if (errorMessage.includes('password authentication failed') || errorMessage.includes('authentication failed')) {
    suggestions.push('Les identifiants sont incorrects');
    suggestions.push(`Vérifiez les variables DB_USER et DB_PASSWORD dans votre fichier .env`);
    suggestions.push(`Utilisateur actuel : ${dbConfig.user}`);
  } else if (errorMessage.includes('role') && errorMessage.includes('does not exist')) {
    suggestions.push(`L'utilisateur PostgreSQL "${dbConfig.user}" n'existe pas`);
    suggestions.push(`Créez-le avec : CREATE USER ${dbConfig.user} WITH PASSWORD '${dbConfig.password}';`);
    suggestions.push('Ou utilisez le script : npm run db:init');
  } else if (errorMessage.includes('permission denied')) {
    suggestions.push(`L'utilisateur "${dbConfig.user}" n'a pas les permissions nécessaires`);
    suggestions.push(`Accordez les droits avec : GRANT ALL PRIVILEGES ON DATABASE ${dbConfig.database} TO ${dbConfig.user};`);
  }

  if (suggestions.length === 0) {
    suggestions.push('Vérifiez votre fichier .env et les paramètres de connexion');
    suggestions.push('Utilisez "npm run db:check" pour un diagnostic détaillé');
  }

  return suggestions;
}

/**
 * Teste la connexion à la base de données PostgreSQL
 * @returns Promise<boolean> - true si la connexion réussit, false sinon
 */
export async function testConnection(): Promise<boolean> {
  let client: PoolClient | null = null;
  try {
    client = await pool.connect();
    await client.query('SELECT NOW()');
    return true;
  } catch (error: any) {
    console.error('\n❌ Erreur de connexion à la base de données PostgreSQL');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('Message d\'erreur:', error?.message || error);
    if (error?.code) {
      console.error('Code d\'erreur:', error.code);
    }
    console.error('\n📋 Paramètres de connexion utilisés:');
    console.error(`   Host: ${dbConfig.host}`);
    console.error(`   Port: ${dbConfig.port}`);
    console.error(`   Database: ${dbConfig.database}`);
    console.error(`   User: ${dbConfig.user}`);
    console.error(`   Password: ${'*'.repeat(dbConfig.password.length)}`);
    
    const suggestions = getErrorSuggestions(error);
    if (suggestions.length > 0) {
      console.error('\n💡 Suggestions de résolution:');
      suggestions.forEach((suggestion, index) => {
        console.error(`   ${index + 1}. ${suggestion}`);
      });
    }
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    return false;
  } finally {
    if (client) {
      client.release();
    }
  }
}

/**
 * Établit la connexion à la base de données et teste la connexion
 */
export async function connectDB(): Promise<void> {
  console.log('\n🔌 Tentative de connexion à PostgreSQL...');
  console.log(`   Host: ${dbConfig.host}:${dbConfig.port}`);
  console.log(`   Database: ${dbConfig.database}`);
  console.log(`   User: ${dbConfig.user}\n`);

  try {
    const isConnected = await testConnection();
    if (isConnected) {
      console.log('✅ Connexion à la base de données PostgreSQL établie avec succès\n');
    } else {
      throw new Error('Échec de la connexion à la base de données');
    }
  } catch (error) {
    throw error;
  }
}

export default pool;
