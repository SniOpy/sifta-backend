#!/usr/bin/env ts-node

import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST ,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME ,
  user: process.env.DB_USER ,  password: process.env.DB_PASSWORD ,
};

interface DiagnosticResult {
  success: boolean;
  message: string;
  details?: string[];
  suggestions?: string[];
}

/**
 * Teste la connexion à PostgreSQL avec l'utilisateur postgres par défaut
 */
async function testPostgresConnection(): Promise<DiagnosticResult> {
  const adminPool = new Pool({
    host: dbConfig.host,
    port: dbConfig.port,
    database: 'postgres',
    user: 'postgres',
    password: process.env.DB_POSTGRES_PASSWORD || '',
  });

  try {
    const client = await adminPool.connect();
    await client.query('SELECT NOW()');
    client.release();
    await adminPool.end();
    return {
      success: true,
      message: 'Connexion PostgreSQL réussie avec l\'utilisateur postgres',
    };
  } catch (error: any) {
    await adminPool.end();
    return {
      success: false,
      message: 'Impossible de se connecter avec l\'utilisateur postgres',
      details: [error?.message || String(error)],
      suggestions: [
        'Vérifiez que PostgreSQL est démarré',
        'Essayez de vous connecter manuellement : psql -U postgres',
      ],
    };
  }
}

/**
 * Vérifie si la base de données existe
 */
async function checkDatabaseExists(): Promise<DiagnosticResult> {
  const adminPool = new Pool({
    host: dbConfig.host,
    port: dbConfig.port,
    database: 'postgres',
    user: 'postgres',
    password: process.env.DB_POSTGRES_PASSWORD || '',
  });

  try {
    const client = await adminPool.connect();
    const result = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [dbConfig.database]
    );
    client.release();
    await adminPool.end();

    if (result.rows.length > 0) {
      return {
        success: true,
        message: `La base de données "${dbConfig.database}" existe`,
      };
    } else {
      return {
        success: false,
        message: `La base de données "${dbConfig.database}" n'existe pas`,
        suggestions: [
          `Créez-la avec : CREATE DATABASE ${dbConfig.database};`,
          'Ou utilisez le script SQL : cat scripts/init-db.sql | psql -U postgres',
        ],
      };
    }
  } catch (error: any) {
    await adminPool.end();
    return {
      success: false,
      message: 'Erreur lors de la vérification de la base de données',
      details: [error?.message || String(error)],
    };
  }
}

/**
 * Vérifie si l'utilisateur existe
 */
async function checkUserExists(): Promise<DiagnosticResult> {
  const adminPool = new Pool({
    host: dbConfig.host,
    port: dbConfig.port,
    database: 'postgres',
    user: 'postgres',
    password: process.env.DB_POSTGRES_PASSWORD || '',
  });

  try {
    const client = await adminPool.connect();
    const result = await client.query(
      'SELECT 1 FROM pg_roles WHERE rolname = $1',
      [dbConfig.user]
    );
    client.release();
    await adminPool.end();

    if (result.rows.length > 0) {
      return {
        success: true,
        message: `L'utilisateur "${dbConfig.user}" existe`,
      };
    } else {
      return {
        success: false,
        message: `L'utilisateur "${dbConfig.user}" n'existe pas`,
        suggestions: [
          `Créez-le avec : CREATE USER ${dbConfig.user} WITH PASSWORD '${dbConfig.password}';`,
          'Ou utilisez le script SQL : cat scripts/init-db.sql | psql -U postgres',
        ],
      };
    }
  } catch (error: any) {
    await adminPool.end();
    return {
      success: false,
      message: 'Erreur lors de la vérification de l\'utilisateur',
      details: [error?.message || String(error)],
    };
  }
}

/**
 * Teste la connexion avec les identifiants configurés
 */
async function testConfiguredConnection(): Promise<DiagnosticResult> {
  const pool = new Pool(dbConfig);

  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    await pool.end();
    return {
      success: true,
      message: 'Connexion réussie avec les identifiants configurés',
    };
  } catch (error: any) {
    await pool.end();
    return {
      success: false,
      message: 'Échec de la connexion avec les identifiants configurés',
      details: [error?.message || String(error)],
      suggestions: [
        'Vérifiez les variables dans votre fichier .env',
        'Assurez-vous que la base de données et l\'utilisateur existent',
      ],
    };
  }
}

/**
 * Fonction principale de diagnostic
 */
async function runDiagnostic() {
  console.log('\n🔍 Diagnostic de la connexion PostgreSQL\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 Configuration:');
  console.log(`   Host: ${dbConfig.host}`);
  console.log(`   Port: ${dbConfig.port}`);
  console.log(`   Database: ${dbConfig.database}`);
  console.log(`   User: ${dbConfig.user}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Test 1: Connexion PostgreSQL de base
  console.log('1️⃣  Test de connexion PostgreSQL...');
  const postgresTest = await testPostgresConnection();
  if (postgresTest.success) {
    console.log(`   ✅ ${postgresTest.message}\n`);
  } else {
    console.log(`   ❌ ${postgresTest.message}`);
    if (postgresTest.details) {
      postgresTest.details.forEach(detail => console.log(`      ${detail}`));
    }
    if (postgresTest.suggestions) {
      console.log('   💡 Suggestions:');
      postgresTest.suggestions.forEach(suggestion => console.log(`      - ${suggestion}`));
    }
    console.log('\n⚠️  Impossible de continuer les autres tests sans connexion PostgreSQL de base.\n');
    process.exit(1);
  }

  // Test 2: Vérification de l'utilisateur
  console.log('2️⃣  Vérification de l\'utilisateur...');
  const userTest = await checkUserExists();
  if (userTest.success) {
    console.log(`   ✅ ${userTest.message}\n`);
  } else {
    console.log(`   ❌ ${userTest.message}`);
    if (userTest.suggestions) {
      console.log('   💡 Suggestions:');
      userTest.suggestions.forEach(suggestion => console.log(`      - ${suggestion}`));
    }
    console.log();
  }

  // Test 3: Vérification de la base de données
  console.log('3️⃣  Vérification de la base de données...');
  const dbTest = await checkDatabaseExists();
  if (dbTest.success) {
    console.log(`   ✅ ${dbTest.message}\n`);
  } else {
    console.log(`   ❌ ${dbTest.message}`);
    if (dbTest.suggestions) {
      console.log('   💡 Suggestions:');
      dbTest.suggestions.forEach(suggestion => console.log(`      - ${suggestion}`));
    }
    console.log();
  }

  // Test 4: Connexion avec les identifiants configurés
  console.log('4️⃣  Test de connexion avec les identifiants configurés...');
  const connectionTest = await testConfiguredConnection();
  if (connectionTest.success) {
    console.log(`   ✅ ${connectionTest.message}\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Tous les tests sont passés avec succès !\n');
    process.exit(0);
  } else {
    console.log(`   ❌ ${connectionTest.message}`);
    if (connectionTest.details) {
      connectionTest.details.forEach(detail => console.log(`      ${detail}`));
    }
    if (connectionTest.suggestions) {
      console.log('   💡 Suggestions:');
      connectionTest.suggestions.forEach(suggestion => console.log(`      - ${suggestion}`));
    }
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('❌ La connexion avec les identifiants configurés a échoué.\n');
    console.log('💡 Pour initialiser la base de données, exécutez :');
    console.log('   npm run db:init\n');
    process.exit(1);
  }
}

// Exécuter le diagnostic
runDiagnostic().catch((error) => {
  console.error('Erreur lors du diagnostic:', error);
  process.exit(1);
});
