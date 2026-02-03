# Documentation API - Sokhra Backend

Documentation complète de l'API REST pour l'intégration frontend.

## Base URL

```
http://localhost:3000/api/v1
```

## Authentification

L'API utilise JWT (JSON Web Tokens) pour l'authentification. Deux types de tokens sont utilisés :

- **Access Token** : JWT avec expiration courte (15 minutes par défaut)
- **Refresh Token** : UUID stocké en base de données avec expiration longue (7 jours par défaut)

### Utilisation des tokens

Pour les routes protégées, inclure le header suivant :

```
Authorization: Bearer <access_token>
```

## Format des réponses

### Réponse de succès

```json
{
  "success": true,
  "message": "Message de succès",
  "data": {
    // Données spécifiques à l'endpoint
  }
}
```

### Réponse d'erreur

```json
{
  "success": false,
  "error": "Type d'erreur",
  "message": "Message d'erreur détaillé"
}
```

## Codes de statut HTTP

- `200` : Succès
- `400` : Erreur de validation
- `401` : Non autorisé (token manquant/invalide/expiré)
- `404` : Ressource non trouvée
- `429` : Trop de requêtes (rate limiting)
- `500` : Erreur interne du serveur

---

## Endpoints d'authentification

### 1. Demander un code OTP

**Endpoint** : `POST /auth/request-otp`

**Description** : Génère et envoie un code OTP au numéro de téléphone fourni.

**Rate Limiting** : 3 requêtes par minute par téléphone

**Body** :
```json
{
  "phone": "+261341234567"
}
```

**Réponse 200** :
```json
{
  "success": true,
  "message": "Code OTP envoyé avec succès",
  "data": {
    "message": "Code OTP envoyé avec succès"
  }
}
```

**Erreurs possibles** :
- `400` : Format de téléphone invalide
- `429` : Trop de requêtes (rate limiting)

**Exemple** :
```bash
curl -X POST http://localhost:3000/api/v1/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+261341234567"}'
```

---

### 2. Vérifier un code OTP

**Endpoint** : `POST /auth/verify-otp`

**Description** : Vérifie le code OTP et authentifie l'utilisateur. Crée l'utilisateur s'il n'existe pas et retourne les tokens JWT.

**Rate Limiting** : 3 requêtes par minute par téléphone

**Body** :
```json
{
  "phone": "+261341234567",
  "code": "123456"
}
```

**Réponse 200** :
```json
{
  "success": true,
  "message": "Code OTP vérifié avec succès",
  "data": {
    "user": {
      "id": "uuid-de-l-utilisateur",
      "phone": "+261341234567",
      "created_at": "2026-02-03T12:00:00.000Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
    }
  }
}
```

**Erreurs possibles** :
- `400` : Format de téléphone ou code OTP invalide
- `404` : Aucun code OTP actif trouvé pour ce numéro
- `400` : Code OTP incorrect
- `429` : Nombre maximum de tentatives atteint (5 par défaut)
- `429` : Trop de requêtes (rate limiting)

**Exemple** :
```bash
curl -X POST http://localhost:3000/api/v1/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+261341234567", "code": "123456"}'
```

---

### 3. Rafraîchir les tokens

**Endpoint** : `POST /auth/refresh`

**Description** : Génère une nouvelle paire de tokens (access + refresh) en utilisant un refresh token valide. Le refresh token utilisé est automatiquement révoqué (rotation).

**Rate Limiting** : 3 requêtes par minute

**Body** :
```json
{
  "refreshToken": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

**Réponse 200** :
```json
{
  "success": true,
  "message": "Tokens rafraîchis avec succès",
  "data": {
    "accessToken": "nouveau-access-token...",
    "refreshToken": "nouveau-refresh-token..."
  }
}
```

**Erreurs possibles** :
- `400` : Format de refresh token invalide (doit être un UUID)
- `401` : Refresh token invalide ou expiré
- `401` : Refresh token déjà utilisé (rotation)
- `429` : Trop de requêtes (rate limiting)

**Important** : Après chaque appel à `/refresh`, utilisez le nouveau `refreshToken` reçu. L'ancien token ne peut plus être utilisé.

**Exemple** :
```bash
curl -X POST http://localhost:3000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"}'
```

---

### 4. Obtenir les informations de l'utilisateur (depuis auth)

**Endpoint** : `GET /auth/me`

**Description** : Retourne les informations de l'utilisateur authentifié (données depuis le JWT, pas de requête DB).

**Authentification** : Requise (Bearer Token)

**Headers** :
```
Authorization: Bearer <access_token>
```

**Réponse 200** :
```json
{
  "success": true,
  "message": "Informations utilisateur récupérées avec succès",
  "data": {
    "user": {
      "id": "uuid-de-l-utilisateur",
      "phone": "+261341234567",
      "created_at": "2026-02-03T12:00:00.000Z"
    }
  }
}
```

**Erreurs possibles** :
- `401` : Token d'authentification requis
- `401` : Format de token invalide
- `401` : Token invalide ou expiré

**Exemple** :
```bash
curl -X GET http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

### 5. Déconnexion (Logout)

**Endpoint** : `POST /auth/logout`

**Description** : Révoque tous les refresh tokens de l'utilisateur, invalidant sa session sur tous les appareils.

**Authentification** : Requise (Bearer Token)

**Headers** :
```
Authorization: Bearer <access_token>
```

**Body** : Aucun body requis

**Réponse 200** :
```json
{
  "success": true,
  "message": "Déconnexion réussie. Tous les tokens ont été révoqués.",
  "data": {}
}
```

**Erreurs possibles** :
- `401` : Token d'authentification requis
- `401` : Token invalide ou expiré

**Exemple** :
```bash
curl -X POST http://localhost:3000/api/v1/auth/logout \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## Endpoints utilisateur

### 6. Obtenir les informations complètes de l'utilisateur

**Endpoint** : `GET /users/me`

**Description** : Retourne les informations complètes de l'utilisateur authentifié depuis la base de données (avec `created_at` et `updated_at` réels).

**Authentification** : Requise (Bearer Token)

**Headers** :
```
Authorization: Bearer <access_token>
```

**Réponse 200** :
```json
{
  "success": true,
  "message": "Informations utilisateur récupérées avec succès",
  "data": {
    "user": {
      "id": "uuid-de-l-utilisateur",
      "phone": "+261341234567",
      "created_at": "2026-02-03T12:00:00.000Z",
      "updated_at": "2026-02-03T12:00:00.000Z"
    }
  }
}
```

**Erreurs possibles** :
- `401` : Token d'authentification requis
- `401` : Token invalide ou expiré
- `404` : Utilisateur non trouvé

**Exemple** :
```bash
curl -X GET http://localhost:3000/api/v1/users/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Note** : Différence avec `/auth/me` :
- `/auth/me` : Utilise les données du JWT (pas de requête DB, plus rapide)
- `/users/me` : Charge l'utilisateur depuis la DB (données complètes avec dates réelles)

---

## Endpoints de santé

### 7. Health Check

**Endpoint** : `GET /health`

**Description** : Vérifie le statut du serveur et de la connexion à la base de données.

**Réponse 200** :
```json
{
  "status": "OK",
  "database": "connected",
  "timestamp": "2026-02-03T12:00:00.000Z"
}
```

**Exemple** :
```bash
curl http://localhost:3000/health
```

---

## Format des numéros de téléphone

Les numéros de téléphone doivent être au format international avec le préfixe `+` :

- Format accepté : `+261341234567`
- Format accepté : `+212627458959`
- Format invalide : `0341234567` (sans préfixe)
- Format invalide : `261341234567` (sans `+`)

Le numéro est automatiquement normalisé par l'API.

---

## Gestion des erreurs

### Messages d'erreur standardisés

#### Erreurs OTP

- `Aucun code OTP actif trouvé pour ce numéro de téléphone` (404)
- `Le code OTP a expiré. Veuillez demander un nouveau code` (400)
- `Le code OTP est incorrect` (400)
- `Le nombre maximum de tentatives (5) a été atteint. Veuillez demander un nouveau code OTP` (429)

#### Erreurs Token

- `Token d'authentification requis` (401)
- `Format de token invalide. Utilisez: Bearer <token>` (401)
- `Token invalide ou expiré` (401)
- `Refresh token invalide ou expiré` (401)
- `Ce refresh token a déjà été utilisé. Veuillez utiliser le nouveau refresh token reçu lors du dernier rafraîchissement.` (401)
- `Refresh token expiré. Veuillez vous ré-authentifier.` (401)

#### Erreurs Utilisateur

- `Utilisateur non authentifié` (401)
- `Utilisateur non trouvé` (404)

---

## Flux d'authentification complet

### 1. Inscription / Connexion

```
1. POST /auth/request-otp
   Body: { "phone": "+261341234567" }
   → Reçoit: { "success": true, "message": "Code OTP envoyé avec succès" }

2. POST /auth/verify-otp
   Body: { "phone": "+261341234567", "code": "123456" }
   → Reçoit: { "success": true, "data": { "user": {...}, "tokens": { "accessToken": "...", "refreshToken": "..." } } }

3. Stocker les tokens côté client
   - accessToken : pour les requêtes authentifiées
   - refreshToken : pour rafraîchir les tokens
```

### 2. Utilisation des routes protégées

```
GET /users/me
Headers: { "Authorization": "Bearer <access_token>" }
→ Reçoit: { "success": true, "data": { "user": {...} } }
```

### 3. Rafraîchissement des tokens

```
POST /auth/refresh
Body: { "refreshToken": "<refresh_token>" }
→ Reçoit: { "success": true, "data": { "accessToken": "...", "refreshToken": "..." } }

⚠️ Important : Remplacer l'ancien refreshToken par le nouveau reçu
```

### 4. Déconnexion

```
POST /auth/logout
Headers: { "Authorization": "Bearer <access_token>" }
→ Reçoit: { "success": true, "message": "Déconnexion réussie..." }

⚠️ Après logout, tous les refresh tokens sont révoqués
```

---

## Exemples d'intégration frontend

### JavaScript / TypeScript

```typescript
// Configuration
const API_BASE_URL = 'http://localhost:3000/api/v1';

// 1. Demander un OTP
async function requestOTP(phone: string) {
  const response = await fetch(`${API_BASE_URL}/auth/request-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
  });
  return response.json();
}

// 2. Vérifier l'OTP
async function verifyOTP(phone: string, code: string) {
  const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, code }),
  });
  const data = await response.json();
  
  if (data.success) {
    // Stocker les tokens
    localStorage.setItem('accessToken', data.data.tokens.accessToken);
    localStorage.setItem('refreshToken', data.data.tokens.refreshToken);
  }
  
  return data;
}

// 3. Requête authentifiée
async function getCurrentUser() {
  const accessToken = localStorage.getItem('accessToken');
  
  const response = await fetch(`${API_BASE_URL}/users/me`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });
  
  if (response.status === 401) {
    // Token expiré, essayer de rafraîchir
    await refreshTokens();
    return getCurrentUser(); // Réessayer
  }
  
  return response.json();
}

// 4. Rafraîchir les tokens
async function refreshTokens() {
  const refreshToken = localStorage.getItem('refreshToken');
  
  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  
  const data = await response.json();
  
  if (data.success) {
    // Mettre à jour les tokens
    localStorage.setItem('accessToken', data.data.accessToken);
    localStorage.setItem('refreshToken', data.data.refreshToken);
  }
  
  return data;
}

// 5. Déconnexion
async function logout() {
  const accessToken = localStorage.getItem('accessToken');
  
  await fetch(`${API_BASE_URL}/auth/logout`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });
  
  // Supprimer les tokens
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}
```

### Axios (avec intercepteur)

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api/v1',
});

// Intercepteur pour ajouter le token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur pour gérer l'expiration du token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Essayer de rafraîchir le token
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const { data } = await axios.post(
            'http://localhost:3000/api/v1/auth/refresh',
            { refreshToken }
          );
          
          localStorage.setItem('accessToken', data.data.accessToken);
          localStorage.setItem('refreshToken', data.data.refreshToken);
          
          // Réessayer la requête originale
          error.config.headers.Authorization = `Bearer ${data.data.accessToken}`;
          return axios.request(error.config);
        } catch (refreshError) {
          // Refresh échoué, rediriger vers login
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Utilisation
const user = await api.get('/users/me');
```

---

## Rate Limiting

L'API applique un rate limiting sur les endpoints d'authentification :

- **Limite** : 3 requêtes par minute (configurable via `OTP_RATE_LIMIT_MAX`)
- **Fenêtre** : 60 secondes (configurable via `OTP_RATE_LIMIT_WINDOW_MS`)

En cas de dépassement, vous recevrez une erreur `429 Too Many Requests`.

---

## Notes importantes

1. **Rotation des refresh tokens** : Après chaque appel à `/refresh`, l'ancien refresh token est révoqué. Utilisez toujours le nouveau token reçu.

2. **Expiration des tokens** :
   - Access Token : 15 minutes (configurable via `JWT_ACCESS_EXPIRES_IN`)
   - Refresh Token : 7 jours (configurable via `JWT_REFRESH_EXPIRES_IN`)

3. **Format des tokens** :
   - Access Token : JWT (chaîne longue commençant par `eyJ...`)
   - Refresh Token : UUID v4 (format `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

4. **Nettoyage automatique** : Les OTP expirés sont automatiquement supprimés toutes les 60 minutes (configurable via `OTP_CLEANUP_INTERVAL_MINUTES`).

5. **Validation des variables d'environnement** : L'API vérifie au démarrage que toutes les variables requises sont définies.

---

## Support

Pour toute question ou problème, consultez :
- `docs/auth-flow.md` : Flux d'authentification détaillé
- `docs/test-endpoint.md` : Guide de test des endpoints
- `README.md` : Documentation générale du projet
