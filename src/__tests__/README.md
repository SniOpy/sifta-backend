# Tests Jest - Module Trips

Ce dossier contient les tests unitaires pour le module Trips.

## Structure des tests

- `setup.ts` - Configuration globale pour tous les tests (connexion DB, cleanup)
- `trip/tripStatus.test.ts` - Tests pour les constantes et validation des transitions de statut
- `trip/tripService.test.ts` - Tests pour le service métier (logique métier, validation)
- `trip/tripModel.test.ts` - Tests pour le modèle de données (accès DB)

## Prérequis

1. **Base de données configurée** :
   - La migration `004_create_trips_table.sql` doit être exécutée
   - Les variables d'environnement dans `.env` doivent être configurées

2. **Dépendances installées** :
   ```bash
   npm install
   ```

## Exécution des tests

### Tous les tests
```bash
npm test
```

### Tests en mode watch (re-exécution automatique)
```bash
npm run test:watch
```

### Tests avec couverture de code
```bash
npm run test:coverage
```

### Tests spécifiques
```bash
# Tous les tests du module trips
npm test -- trip

# Tests de statut uniquement
npm test -- tripStatus

# Tests du service uniquement
npm test -- tripService

# Tests du modèle uniquement
npm test -- tripModel
```

## Tests inclus

### tripStatus.test.ts
- Validation de tous les statuts autorisés
- Validation des transitions autorisées
- Tests de `isValidTransition()`
- Tests de `canTransition()` (avec vérification completed/cancelled)
- Tests de `isValidStatus()`

### tripService.test.ts
- Création de trajets (avec et sans prix)
- Récupération d'un trajet par ID
- Vérification de propriété (ForbiddenError)
- Mise à jour de statut avec validation des transitions
- Rejet des modifications sur trajets completed/cancelled
- Annulation de trajets

### tripModel.test.ts
- Création de trajets en base de données
- Recherche par ID
- Recherche par utilisateur avec pagination
- Filtrage par statut
- Mise à jour de statut

## Notes importantes

- Les tests `tripModel.test.ts` nécessitent une connexion réelle à la base de données
- Les tests `tripService.test.ts` utilisent des mocks pour isoler la logique métier
- La base de données est nettoyée avant et après chaque test
- Les tests créent des utilisateurs et trajets de test qui sont supprimés automatiquement

## Résolution de problèmes

### Erreur de connexion à la base de données
- Vérifiez que PostgreSQL est démarré
- Vérifiez les variables d'environnement dans `.env`
- Exécutez la migration : `psql -U postgres -d sokhra_db -f scripts/migrations/004_create_trips_table.sql`

### Tests qui échouent
- Vérifiez que la base de données est propre (pas de données de test résiduelles)
- Vérifiez que les migrations sont à jour
- Consultez les logs détaillés avec `npm test -- --verbose`
