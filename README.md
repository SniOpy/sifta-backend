# sokhra-backend

Backend minimal Express avec TypeScript et PostgreSQL.

## Prérequis

- Node.js (version 20 ou supérieure recommandée)
- PostgreSQL (version 12 ou supérieure)
- npm ou yarn
- nvm (Node Version Manager) - recommandé pour gérer les versions de Node.js

## Installation

### Utiliser nvm pour la version de Node.js

Ce projet inclut un fichier `.nvmrc` qui spécifie la version de Node.js à utiliser (Node.js 20).

**Les scripts npm (`npm run dev`, `npm run build`, etc.) chargent automatiquement la bonne version de Node.js via nvm.**

Si vous rencontrez des erreurs de syntaxe (comme `Unexpected token '?'`), cela signifie que votre terminal utilise une ancienne version de Node.js. Voici comment résoudre le problème :

1. **Charger nvm dans votre terminal** (si ce n'est pas déjà fait automatiquement) :
```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
```

2. **Basculer vers la version de Node.js du projet** :
```bash
nvm use
```

Si la version n'est pas installée, nvm vous proposera de l'installer automatiquement.

3. **Vérifier la version de Node.js** :
```bash
node --version
```

Vous devriez voir `v20.20.0` ou une version similaire (v20.x.x).

**Note** : Pour que nvm se charge automatiquement à chaque ouverture de terminal, assurez-vous que ces lignes sont présentes dans votre `~/.zshrc` :
```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
```

### Installation des dépendances

1. Installer les dépendances :
```bash
npm install
```

2. Configurer les variables d'environnement :
```bash
cp .env.example .env
```

3. Modifier le fichier `.env` avec vos paramètres de connexion PostgreSQL :
```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sokhra_db
DB_USER=spkhra_user
DB_PASSWORD=MadapesAgencyCreation
```

### Initialisation de la base de données

Avant de démarrer le serveur, vous devez créer la base de données et l'utilisateur PostgreSQL.

#### Option 1 : Utiliser le script SQL (recommandé)

```bash
psql -U postgres -f scripts/init-db.sql
```

#### Option 2 : Vérifier la configuration

Pour diagnostiquer les problèmes de connexion :

```bash
npm run db:check
```

Ce script vérifie :
- La connexion PostgreSQL de base
- L'existence de l'utilisateur configuré
- L'existence de la base de données
- La connexion avec les identifiants configurés

#### Option 3 : Création manuelle

Si vous préférez créer manuellement :

```sql
-- Se connecter à PostgreSQL
psql -U postgres

-- Créer l'utilisateur
CREATE USER spkhra_user WITH PASSWORD 'MadapesAgencyCreation';

-- Créer la base de données
CREATE DATABASE sokhra_db OWNER spkhra_user;

-- Accorder les privilèges
GRANT ALL PRIVILEGES ON DATABASE sokhra_db TO spkhra_user;
```

## Démarrage

### Mode développement
```bash
npm run dev
```

Le serveur démarre avec rechargement automatique grâce à `ts-node-dev`.

### Mode production
```bash
# Compiler le TypeScript
npm run build

# Démarrer le serveur
npm start
```

## Routes

### GET /health
Vérifie le statut du serveur et de la connexion à la base de données.

**Réponse :**
```json
{
  "status": "OK",
  "database": "connected",
  "timestamp": "2026-02-02T12:00:00.000Z"
}
```

**Test :**
```bash
curl http://localhost:3000/health
```

## Structure du projet

```
sokhra-backend/
├── src/
│   ├── index.ts          # Point d'entrée du serveur
│   ├── routes/
│   │   └── health.ts     # Route /health
│   └── config/
│       └── database.ts   # Configuration PostgreSQL
├── scripts/
│   ├── with-nvm.sh       # Script wrapper pour charger nvm automatiquement
│   ├── check-db.ts       # Script de diagnostic de connexion PostgreSQL
│   └── init-db.sql       # Script SQL d'initialisation de la base de données
├── .env                  # Variables d'environnement (non versionné)
├── .env.example          # Template des variables
├── .nvmrc                # Version de Node.js recommandée
├── package.json          # Dépendances et scripts
├── tsconfig.json         # Configuration TypeScript
└── README.md             # Documentation
```

## Scripts disponibles

- `npm run dev` : Démarre le serveur en mode développement avec rechargement automatique
- `npm run build` : Compile le TypeScript vers JavaScript dans le dossier `dist/`
- `npm start` : Démarre le serveur en mode production (nécessite un build préalable)
- `npm run type-check` : Vérifie les types TypeScript sans compiler
- `npm run db:check` : Diagnostic de la connexion PostgreSQL (vérifie la DB, l'utilisateur, etc.)
- `npm run db:init` : Affiche les instructions pour initialiser la base de données

## Dépannage

### Erreur de connexion à la base de données

Si vous rencontrez une erreur lors du démarrage du serveur :

```
❌ Erreur lors de la connexion à la base de données
```

#### Étapes de diagnostic

1. **Vérifier que PostgreSQL est démarré** :
   ```bash
   # Linux
   sudo service postgresql status
   sudo service postgresql start  # Si arrêté
   
   # macOS (Homebrew)
   brew services list
   brew services start postgresql  # Si arrêté
   ```

2. **Exécuter le diagnostic** :
   ```bash
   npm run db:check
   ```
   Ce script vous indiquera exactement ce qui manque (utilisateur, base de données, etc.)

3. **Vérifier les variables d'environnement** :
   Assurez-vous que votre fichier `.env` contient les bonnes valeurs et correspond à votre configuration PostgreSQL.

4. **Messages d'erreur détaillés** :
   Le serveur affiche maintenant des messages d'erreur détaillés avec des suggestions de résolution. Consultez la sortie de la console pour plus d'informations.

#### Erreurs communes

**"database does not exist"**
- La base de données n'existe pas
- Solution : Exécutez `psql -U postgres -f scripts/init-db.sql`

**"role does not exist"**
- L'utilisateur PostgreSQL n'existe pas
- Solution : Exécutez `psql -U postgres -f scripts/init-db.sql`

**"Connection refused"**
- PostgreSQL n'est pas démarré ou n'écoute pas sur le port configuré
- Solution : Démarrez PostgreSQL et vérifiez le port dans `.env`

**"password authentication failed"**
- Les identifiants sont incorrects
- Solution : Vérifiez `DB_USER` et `DB_PASSWORD` dans votre fichier `.env`

## Critères de succès

✅ Le serveur démarre sur le port configuré (par défaut 3000)  
✅ La route `GET /health` retourne `{ status: "OK" }`  
✅ La connexion PostgreSQL est établie au démarrage  
✅ Les variables d'environnement sont correctement chargées  
✅ Le code est en TypeScript avec types stricts


Nouveau test