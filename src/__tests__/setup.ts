import dotenv from 'dotenv';
import pool from '../config/database';

// Charger les variables d'environnement
dotenv.config();

// Nettoyer la base de données avant tous les tests
beforeAll(async () => {
  // S'assurer que la connexion à la base de données fonctionne
  try {
    await pool.query('SELECT 1');
  } catch (error) {
    console.error('❌ Erreur de connexion à la base de données:', error);
    throw error;
  }
});

// Nettoyer après tous les tests
afterAll(async () => {
  await pool.end();
});
