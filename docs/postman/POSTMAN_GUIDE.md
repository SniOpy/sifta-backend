# Guide d'utilisation Postman - Collection Sokhra Trips

Ce guide vous explique comment utiliser la collection Postman pour tester toutes les routes du module Trips de l'API Sokhra.

## Table des matières

1. [Installation](#installation)
2. [Configuration](#configuration)
3. [Ordre de test recommandé](#ordre-de-test-recommandé)
4. [Variables d'environnement](#variables-denvironnement)
5. [Détails des requêtes](#détails-des-requêtes)
6. [Tests automatiques](#tests-automatiques)
7. [Dépannage](#dépannage)

## Installation

### Étape 1 : Importer la collection

1. Ouvrez Postman
2. Cliquez sur **Import** (en haut à gauche)
3. Sélectionnez le fichier `Sokhra_Trips_Collection.json`
4. La collection "Sokhra - Trips API" apparaîtra dans votre workspace

### Étape 2 : Créer un environnement

1. Cliquez sur **Environments** dans la barre latérale gauche
2. Cliquez sur **+** pour créer un nouvel environnement
3. Nommez-le "Sokhra Local" (ou un nom de votre choix)
4. Ajoutez les variables suivantes :

| Variable | Valeur initiale | Description |
|----------|----------------|-------------|
| `base_url` | `http://localhost:3000/api/v1` | URL de base de l'API |
| `access_token` | (vide) | Token JWT (rempli automatiquement) |
| `trip_id` | (vide) | ID du trajet (rempli automatiquement) |

5. Cliquez sur **Save**
6. Sélectionnez cet environnement dans le menu déroulant en haut à droite

## Configuration

### Prérequis

Avant de commencer les tests, assurez-vous que :

1. **Le serveur backend est démarré** :
   ```bash
   npm run dev
   ```

2. **La base de données est initialisée** :
   ```bash
   psql -U postgres -d sokhra_db -f scripts/migrations/004_create_trips_table.sql
   ```

3. **Vous avez un numéro de téléphone valide** pour recevoir le code OTP (format : `+261341234567`)

### Configuration des variables

Les variables sont automatiquement remplies par les scripts Postman, mais vous pouvez aussi les modifier manuellement :

- **base_url** : Changez si votre serveur tourne sur un autre port ou domaine
- **access_token** : Rempli automatiquement après "Verify OTP"
- **trip_id** : Rempli automatiquement après "Create Trip"

## Ordre de test recommandé

Suivez cet ordre pour tester efficacement toutes les routes :

### Phase 1 : Authentification

1. **Request OTP**
   - Envoie un code OTP à votre téléphone
   - Vérifiez la console du serveur pour voir le code (en mode développement)

2. **Verify OTP**
   - Entrez le code OTP reçu
   - ✅ L'`access_token` est automatiquement sauvegardé
   - Vérifiez dans l'onglet "Tests" que le token a été sauvegardé

### Phase 2 : Création de trajets

3. **Create Trip**
   - Crée un trajet avec prix
   - ✅ Le `trip_id` est automatiquement sauvegardé
   - Notez l'ID dans la réponse pour référence

4. **Create Trip - Without Price**
   - Crée un trajet sans prix (optionnel)
   - Vérifie que le prix est `null` dans la réponse

5. **Create Trip - Invalid (Missing Fields)**
   - Teste la validation (doit retourner 400)
   - Vérifie le message d'erreur

### Phase 3 : Liste des trajets

6. **Get All Trips**
   - Récupère tous vos trajets
   - Vérifie la structure de pagination

7. **Get Trips - Paginated**
   - Teste la pagination avec `page=1&limit=5`
   - Vérifie que le nombre de résultats respecte la limite

8. **Get Trips - Filter by Status**
   - Filtre par statut `pending`
   - Vérifie que tous les trajets retournés ont le statut `pending`

9. **Get Trips - Invalid Pagination**
   - Teste la validation (doit retourner 400)
   - Vérifie le message d'erreur

### Phase 4 : Détails d'un trajet

10. **Get Trip by ID**
    - Récupère les détails du trajet créé
    - Utilise la variable `{{trip_id}}` automatiquement

11. **Get Trip - Not Found**
    - Teste le cas d'erreur 404
    - Vérifie le message d'erreur

### Phase 5 : Annulation

12. **Cancel Trip**
    - Annule le trajet créé
    - Vérifie que le statut est `cancelled`

13. **Cancel Trip - Already Cancelled**
    - Teste qu'on ne peut pas annuler deux fois
    - Doit retourner 400

## Variables d'environnement

### Variables de la collection

La collection utilise 3 variables :

| Variable | Type | Description | Remplissage |
|----------|------|-------------|-------------|
| `base_url` | string | URL de base de l'API | Manuel |
| `access_token` | string | Token JWT pour authentification | Automatique (après Verify OTP) |
| `trip_id` | string | ID du trajet créé | Automatique (après Create Trip) |

### Utilisation des variables

Dans Postman, utilisez `{{variable_name}}` pour référencer une variable :

- URL : `{{base_url}}/trips`
- Header : `Bearer {{access_token}}`
- Path : `/trips/{{trip_id}}`

### Vérifier les variables

Pour vérifier que les variables sont bien remplies :

1. Cliquez sur l'icône **👁️** (eye) à côté de l'environnement
2. Vérifiez que `access_token` et `trip_id` sont remplis après les requêtes correspondantes

## Détails des requêtes

### 1. Authentication

#### Request OTP
- **Méthode** : POST
- **URL** : `{{base_url}}/auth/request-otp`
- **Body** : `{ "phone": "+261341234567" }`
- **Réponse attendue** : 200 avec message de succès

#### Verify OTP
- **Méthode** : POST
- **URL** : `{{base_url}}/auth/verify-otp`
- **Body** : `{ "phone": "+261341234567", "code": "123456" }`
- **Script automatique** : Sauvegarde `access_token` dans les variables
- **Réponse attendue** : 200 avec tokens JWT

### 2. Trips - Create

#### Create Trip
- **Méthode** : POST
- **URL** : `{{base_url}}/trips`
- **Headers** : `Authorization: Bearer {{access_token}}`
- **Body** :
  ```json
  {
    "from": "Casablanca, Maroc",
    "to": "Rabat, Maroc",
    "price": 150.50,
    "currency": "MAD"
  }
  ```
- **Script automatique** : Sauvegarde `trip_id` dans les variables
- **Réponse attendue** : 201 avec trajet créé (statut `pending`)

#### Create Trip - Without Price
- Même structure que Create Trip mais sans `price` et `currency`
- **Réponse attendue** : 201 avec `price: null`

#### Create Trip - Invalid
- Teste la validation avec champ `to` manquant
- **Réponse attendue** : 400 avec message d'erreur de validation

### 3. Trips - List

#### Get All Trips
- **Méthode** : GET
- **URL** : `{{base_url}}/trips`
- **Headers** : `Authorization: Bearer {{access_token}}`
- **Réponse attendue** : 200 avec liste paginée

#### Get Trips - Paginated
- **URL** : `{{base_url}}/trips?page=1&limit=5`
- **Réponse attendue** : 200 avec maximum 5 résultats

#### Get Trips - Filter by Status
- **URL** : `{{base_url}}/trips?status=pending&page=1&limit=10`
- **Réponse attendue** : 200 avec uniquement les trajets `pending`

#### Get Trips - Invalid Pagination
- **URL** : `{{base_url}}/trips?page=0&limit=0`
- **Réponse attendue** : 400 avec message d'erreur de validation

### 4. Trips - Get Details

#### Get Trip by ID
- **Méthode** : GET
- **URL** : `{{base_url}}/trips/{{trip_id}}`
- **Headers** : `Authorization: Bearer {{access_token}}`
- **Réponse attendue** : 200 avec détails du trajet

#### Get Trip - Not Found
- **URL** : `{{base_url}}/trips/00000000-0000-0000-0000-000000000000`
- **Réponse attendue** : 404 avec message "Trajet non trouvé"

### 5. Trips - Cancel

#### Cancel Trip
- **Méthode** : POST
- **URL** : `{{base_url}}/trips/{{trip_id}}/cancel`
- **Headers** : `Authorization: Bearer {{access_token}}`
- **Réponse attendue** : 200 avec trajet mis à jour (statut `cancelled`)

#### Cancel Trip - Already Cancelled
- Même requête que Cancel Trip mais sur un trajet déjà annulé
- **Réponse attendue** : 400 avec message "Ce trajet ne peut pas être annulé"

## Tests automatiques

Chaque requête inclut des tests automatiques dans l'onglet **Tests**. Ces tests vérifient :

- **Code de statut HTTP** : Vérifie que la réponse a le bon code (200, 201, 400, 404, etc.)
- **Structure de la réponse** : Vérifie que les champs attendus sont présents
- **Valeurs spécifiques** : Vérifie certaines valeurs (statut, pagination, etc.)

### Exécuter tous les tests

1. Sélectionnez la collection "Sokhra - Trips API"
2. Cliquez sur **Run** (en haut à droite)
3. Cliquez sur **Run Sokhra - Trips API**
4. Les tests s'exécutent automatiquement dans l'ordre

### Résultats des tests

- ✅ Vert : Test réussi
- ❌ Rouge : Test échoué (voir les détails dans la console)

## Dépannage

### Problème : "access_token is empty"

**Solution** :
1. Vérifiez que vous avez exécuté "Verify OTP" avant les routes protégées
2. Vérifiez que le code OTP est correct
3. Regardez la console Postman (onglet "Console" en bas) pour voir les messages de script
4. Vérifiez manuellement dans l'environnement que `access_token` est rempli

### Problème : "401 Unauthorized"

**Solutions** :
1. Vérifiez que `access_token` est bien rempli
2. Vérifiez que le token n'a pas expiré (15 minutes par défaut)
3. Ré-exécutez "Verify OTP" pour obtenir un nouveau token
4. Vérifiez que le header `Authorization` est bien présent avec `Bearer {{access_token}}`

### Problème : "trip_id is empty"

**Solution** :
1. Vérifiez que vous avez exécuté "Create Trip" avant les routes qui utilisent `{{trip_id}}`
2. Vérifiez que la création a réussi (code 201)
3. Regardez la console Postman pour voir les messages de script
4. Vous pouvez aussi copier manuellement l'ID depuis la réponse de "Create Trip"

### Problème : "404 Not Found" sur Get Trip by ID

**Solutions** :
1. Vérifiez que `trip_id` est bien rempli et correct
2. Vérifiez que le trajet existe toujours (il pourrait avoir été supprimé)
3. Vérifiez que vous utilisez le bon `trip_id` (celui d'un trajet que vous avez créé)

### Problème : "400 Bad Request" sur Create Trip

**Solutions** :
1. Vérifiez que tous les champs requis sont présents (`from`, `to`)
2. Vérifiez le format du JSON (virgules, guillemets)
3. Vérifiez que `price` est un nombre positif si fourni
4. Vérifiez que `currency` fait exactement 3 caractères si fourni

### Problème : Le serveur ne répond pas

**Solutions** :
1. Vérifiez que le serveur est démarré : `npm run dev`
2. Vérifiez que le port est correct (3000 par défaut)
3. Vérifiez que `base_url` dans l'environnement est correct
4. Vérifiez les logs du serveur pour voir les erreurs

### Problème : Rate limiting (429)

**Solutions** :
1. Attendez 1 minute avant de réessayer (pour création de trajets)
2. Attendez 1 heure avant de réessayer (pour annulation)
3. Ou modifiez les limites dans `.env` si nécessaire

## Conseils supplémentaires

### Utiliser la console Postman

La console Postman (View > Show Postman Console) affiche :
- Les requêtes envoyées
- Les réponses reçues
- Les messages des scripts (comme "✅ Access token sauvegardé")

### Sauvegarder les réponses

Pour sauvegarder une réponse :
1. Cliquez sur **Save Response** sous la réponse
2. Donnez un nom à la réponse
3. Elle sera sauvegardée avec la requête

### Dupliquer une requête

Pour créer une variante d'une requête :
1. Clic droit sur la requête
2. **Duplicate**
3. Modifiez selon vos besoins

### Exporter la collection

Pour partager la collection :
1. Clic droit sur la collection
2. **Export**
3. Choisissez le format v2.1
4. Sauvegardez le fichier JSON

## Support

Pour toute question ou problème :
- Consultez la documentation API : `docs/API.md`
- Vérifiez les logs du serveur backend
- Consultez les tests automatiques dans l'onglet "Tests" de chaque requête
