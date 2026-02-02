-- Script d'initialisation de la base de données PostgreSQL pour sokhra-backend
-- Usage: psql -U postgres -f scripts/init-db.sql
-- Ou: cat scripts/init-db.sql | psql -U postgres

-- Variables (à adapter selon votre configuration)
-- Ces valeurs doivent correspondre à celles dans votre fichier .env
\set db_name 'sokhra_db'
\set db_user 'sokhra_user'
\set db_password 'MadapesAgencyCreation'

-- Création de l'utilisateur (si il n'existe pas déjà)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = :'db_user') THEN
        CREATE USER :db_user WITH PASSWORD :'db_password';
        RAISE NOTICE 'Utilisateur % créé avec succès', :'db_user';
    ELSE
        RAISE NOTICE 'L''utilisateur % existe déjà', :'db_user';
    END IF;
END
$$;

-- Création de la base de données (si elle n'existe pas déjà)
SELECT 'CREATE DATABASE ' || :'db_name' || ' OWNER ' || :'db_user'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = :'db_name')\gexec

-- Connexion à la nouvelle base de données
\c :db_name

-- Attribution des privilèges à l'utilisateur
GRANT ALL PRIVILEGES ON DATABASE :db_name TO :db_user;
ALTER DATABASE :db_name OWNER TO :db_user;

-- Attribution des privilèges sur le schéma public
GRANT ALL ON SCHEMA public TO :db_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO :db_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO :db_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO :db_user;

-- Message de confirmation
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '✅ Base de données initialisée avec succès !'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo ''
\echo '📋 Résumé:'
\echo '   Database: ' :db_name
\echo '   User: ' :db_user
\echo ''
\echo '💡 Vous pouvez maintenant démarrer le serveur avec:'
\echo '   npm run dev'
\echo ''
