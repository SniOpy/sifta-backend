/**
 * Exécute toutes les migrations SQL dans l'ordre.
 * Utilise les variables d'environnement du fichier .env (même config que l'app).
 *
 * Usage: npm run db:migrate   ou   npx ts-node scripts/run-migrations.ts
 */

import 'dotenv/config';
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'sokhra_db',
  user: process.env.DB_USER || 'sokhra_user',
  password: process.env.DB_PASSWORD,
});

// Ordre des migrations (007_add_job_fields exclu : pour ancien schéma avec user_id/distance_km)
const MIGRATION_FILES = [
  '001_create_otp_table.sql',
  '002_create_users_table.sql',
  '003_create_refresh_tokens_table.sql',
  '004_create_trips_table.sql',
  '005_add_unpaid_payment_status.sql',
  '006_create_jobs_table.sql',
  '007_create_pricing_rules_table.sql',
  '008_update_jobs_table.sql',
  '009_create_courier_account_table.sql',
  '010_rename_jobs_to_courses.sql',
  '012_create_commission_logs_table.sql',
  '013_seed_pricing_rules_all_cities.sql',
  '015_add_user_account_type.sql',
  '016_add_course_pickup_delivery_addresses.sql',
  '017_otp_codes_add_role.sql',
  '018_users_add_role_onboarding.sql',
  '019_users_add_is_admin.sql',
  '020_trips_add_pickup_dropoff_lat_lng.sql',
  '021_trips_add_courier_id.sql',
];

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

async function runMigrations() {
  console.log('\n🔄 Exécution des migrations...\n');
  console.log(`   Base: ${process.env.DB_NAME || 'sokhra_db'} @ ${process.env.DB_HOST || 'localhost'}\n`);

  let client;
  try {
    client = await pool.connect();
  } catch (err: any) {
    console.error('❌ Impossible de se connecter à la base de données:', err.message);
    process.exit(1);
  }

  try {
    for (const file of MIGRATION_FILES) {
      const filePath = path.join(MIGRATIONS_DIR, file);
      if (!fs.existsSync(filePath)) {
        console.warn(`⚠️  Fichier non trouvé: ${file}`);
        continue;
      }
      const sql = fs.readFileSync(filePath, 'utf-8');
      try {
        await client.query(sql);
        console.log(`   ✅ ${file}`);
      } catch (err: any) {
        console.error(`   ❌ ${file}: ${err.message}`);
        throw err;
      }
    }
    console.log('\n✅ Toutes les migrations ont été exécutées avec succès.\n');
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations().catch((err) => {
  console.error(err);
  process.exit(1);
});
