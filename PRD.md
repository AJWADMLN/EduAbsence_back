# Product Requirements Document (PRD) — Backend

## Projet : GestionAbsenceAPI — Système de Gestion des Absences des Enseignants

**Version:** 2.0.0  
**Date:** Mars 2026  
**Type:** API RESTful Backend (Node.js / Express)  
**Base de données :** MongoDB Atlas (`EduAbsenceCluster`)  
**Statut:** En production

---

## 1. Vue d'ensemble

GestionAbsenceAPI est une API REST Node.js/Express qui centralise le suivi des absences des enseignants dans plusieurs établissements scolaires du système éducatif marocain. Un contrôle d'accès basé sur les rôles distingue deux familles d'utilisateurs :

- **Admins** (`admin principal`, `consultant`) — gérés dans la collection `User` (modèle `AdminModel`).
- **Directeurs** (`directeur`) — gérés dans la collection `Directeur`.

Le frontend React consomme cette API via JWT.

---

## 2. Buts & Objectifs

- Fournir une API sécurisée pour enregistrer les absences par période de session.
- Permettre aux directeurs de déclarer, modifier et supprimer des absences limitées à leur établissement.
- Permettre à l'Admin Principal de gérer les entités (directeurs, enseignants, établissements) et les comptes consultants.
- Offrir aux Consultants un accès en lecture seule sur toutes les ressources.
- Maintenir automatiquement le cumul des heures d'absence par enseignant à chaque opération CRUD sur les absences.

---

## 3. Rôles Utilisateurs

| Rôle                | Valeur en base       | Description |
|---------------------|----------------------|-------------|
| **Admin Principal** | `"admin principal"`  | Super-utilisateur. Gère les consultants, les directeurs, les enseignants et les établissements. Peut modifier son propre profil. |
| **Consultant**      | `"consultant"`       | Accès en lecture seule. Peut consulter toutes les ressources mais ne peut pas créer, modifier ou supprimer. |
| **Directeur**       | `"directeur"`        | Limité à son établissement via `etaId` embarqué dans le JWT. Gère uniquement les absences de ses enseignants. |

> **Note :** Le rôle `"admin principal"` est seeded manuellement via `src/seedAdminPrincipal.mjs`. Les consultants sont créés par l'Admin Principal via l'API.

---

## 4. Entités & Modèles de Données

### 4.1 Admin (`AdminModel` → collection `users`)

| Champ      | Type    | Contraintes |
|------------|---------|-------------|
| `nom`      | String  | Requis |
| `prenom`   | String  | Requis |
| `email`    | String  | Requis, Unique |
| `password` | String  | Requis, haché bcrypt (10 rounds) |
| `role`     | String  | Enum : `"consultant"` \| `"admin principal"` |
| `validate` | Boolean | Par défaut `false`. L'Admin Principal a `validate: true`. |

### 4.2 Directeur (`DirecteurModel` → collection `directeurs`)

| Champ      | Type   | Contraintes |
|------------|--------|-------------|
| `id`       | Number | Requis, Unique |
| `nom`      | String | Requis |
| `prenom`   | String | Requis |
| `email`    | String | Requis, Unique |
| `password` | String | Requis, haché bcrypt |
| `role`     | String | Fixe : `"directeur"` |
| `etaId`    | Number | Requis — lié à un établissement |

### 4.3 Etablissement (`EtaModel` → collection `etas`)

| Champ     | Type   | Contraintes |
|-----------|--------|-------------|
| `id`      | Number | Requis, Unique |
| `nom`     | String | Requis, Unique |
| `cycle`   | String | Requis — Enum : `"Primaire"` \| `"Collège"` \| `"Lycée"` |
| `adresse` | String | Requis |

### 4.4 Enseignant (`EnseignModel` → collection `enseignants`)

| Champ                | Type   | Contraintes |
|----------------------|--------|-------------|
| `ppr`                | Number | Requis, Unique — identifiant national |
| `nom`                | String | Requis |
| `prenom`             | String | Requis |
| `sexe`               | String | Requis — Enum : `"Masculin"` \| `"Féminin"` |
| `etaId`              | Number | Requis — lié à un établissement |
| `cycle`              | String | Optionnel — Enum : `"Primaire"` \| `"Collège"` \| `"Lycée"` |
| `matiere`            | String | Optionnel |
| `totalHeureAbsences` | Number | Par défaut `0` — mis à jour automatiquement |

### 4.5 Absence (`AbsenceModel` → collection `absences`)

| Champ          | Type   | Contraintes |
|----------------|--------|-------------|
| `id`           | Number | Requis, Unique (généré via `Date.now()` si non fourni) |
| `dateAbsence`  | Date   | Requis |
| `enseignantPpr`| Number | Requis — PPR de l'enseignant |
| `etaId`        | Number | Requis — ID de l'établissement |
| `periode`      | Number | Requis — Enum entier : 1, 2, 3 ou 4 (heures) |
| `heureDebut`   | String | Par défaut `"09:00"` ; `"15:00"` si `quart="soir"` |
| `quart`        | String | Optionnel — Enum : `"matin"` \| `"soir"` |

> `dateAbsence` est sérialisée en `YYYY-MM-DD` dans toutes les réponses JSON via `toJSON`.

---

## 5. Authentification & Autorisation

| Mécanisme | Détail |
|-----------|--------|
| **Connexion Unifiée** | `POST /api/auth/login` — cherche d'abord dans `AdminModel`, puis dans `DirecteurModel`. |
| **JWT** | Signé avec `"secret"`, expire dans **1 heure**. Payload : `{ id, role, nom, prenom, etaId? }` |
| **Compte consultant** | `validate: true` est requis pour se connecter. L'Admin Principal définit ce flag lors de la création. |
| **Middleware `verifyToken`** | Vérifie et décode le JWT dans l'en-tête `Authorization: Bearer <token>`. |
| **Middleware `verifyRole`** | Vérifie que `req.user.role` correspond au(x) rôle(s) autorisé(s). |
| **Isolation Directeur** | `etaId` du JWT est utilisé dans chaque requête pour restreindre l'accès aux données de l'établissement. |
| **Hachage** | `bcryptjs` avec 10 salt rounds. |

---

## 6. Référence des Endpoints de l'API

Base URL : `http://localhost:5000`

### 6.1 Authentification

| Méthode | Endpoint           | Auth   | Corps / Réponse |
|---------|--------------------|--------|-----------------|
| POST    | `/api/auth/login`  | Aucune | `{ email, password }` → `{ token, role }` |

### 6.2 Routes Admin (`/api/admin`) — Middleware : `verifyToken`

#### Consultants (Admin Principal uniquement)
| Méthode | Endpoint                   | Rôle requis    | Description |
|---------|----------------------------|----------------|-------------|
| POST    | `/consultant`              | admin principal | Créer un consultant (`validate: true` automatique) |
| GET     | `/consultants`             | admin principal | Lister tous les consultants |
| DELETE  | `/consultant/:id`          | admin principal | Supprimer un consultant |

#### Profil Admin Principal
| Méthode | Endpoint     | Rôle requis    | Description |
|---------|--------------|----------------|-------------|
| PUT     | `/principal` | admin principal | Modifier le profil (nom, prénom, email, mot de passe avec vérification ancien mdp) |

#### Directeurs
| Méthode | Endpoint                   | Rôle requis    | Description |
|---------|----------------------------|----------------|-------------|
| POST    | `/directeur`               | admin principal | Créer un directeur |
| GET     | `/directeurs`              | consultant+    | Lister tous les directeurs |
| GET     | `/directeur/:id`           | consultant+    | Obtenir un directeur par ID |
| PUT     | `/directeur/:id`           | admin principal | Modifier un directeur |
| DELETE  | `/directeur/:id`           | admin principal | Supprimer un directeur |
| GET     | `/directeur/:id/details`   | consultant+    | Directeur + Etablissement + Enseignants liés |

#### Enseignants
| Méthode | Endpoint                               | Rôle requis    | Description |
|---------|----------------------------------------|----------------|-------------|
| GET     | `/enseignants`                         | consultant+    | Lister tous les enseignants |
| GET     | `/enseignant/:ppr`                     | consultant+    | Obtenir un enseignant par PPR |
| POST    | `/enseignant`                          | admin principal | Créer un enseignant |
| PUT     | `/enseignant/:ppr`                     | admin principal | Modifier un enseignant |
| DELETE  | `/enseignant/:ppr`                     | admin principal | Supprimer un enseignant |
| GET     | `/enseignants/byEtablissement/:etaId`  | consultant+    | Enseignants d'un établissement donné |

#### Etablissements
| Méthode | Endpoint                                  | Rôle requis    | Description |
|---------|-------------------------------------------|----------------|-------------|
| GET     | `/etablissements`                         | consultant+    | Lister tous les établissements |
| GET     | `/etablissement/:id`                      | consultant+    | Obtenir un établissement |
| POST    | `/etablissement`                          | admin principal | Créer un établissement |
| PUT     | `/etablissement/:id`                      | admin principal | Modifier un établissement |
| DELETE  | `/etablissement/:id`                      | admin principal | Supprimer un établissement |
| GET     | `/etablissementWithEnseignants/:etaId`    | consultant+    | Etablissement + ses enseignants |

#### Absences & Statistiques (Admin)
| Méthode | Endpoint                                   | Rôle requis | Description |
|---------|--------------------------------------------|-------------|-------------|
| GET     | `/absences`                                | consultant+ | Toutes les absences |
| GET     | `/statistiques`                            | consultant+ | Stats globales (byCycle, bySexe, byEta) — query: `?start=&end=` |
| GET     | `/statistiques/top-absents`                | consultant+ | Top N enseignants les plus absents — query: `?limit=` (max 10) |
| GET     | `/statistiques/absences-aujourd-hui`       | consultant+ | Absences du jour courant |
| GET     | `/statistiques/par-mois`                   | consultant+ | Stats par mois — query: `?year=&etaId=&cycle=` |

### 6.3 Routes Directeur (`/api/directeur`) — Middleware : `verifyToken`

| Méthode | Endpoint                              | Rôle requis | Description |
|---------|---------------------------------------|-------------|-------------|
| POST    | `/login`                              | Aucune      | Connexion directeur (legacy) |
| GET     | `/etablissement`                      | directeur   | Etablissement du directeur connecté |
| GET     | `/enseignants`                        | directeur   | Enseignants de l'établissement |
| GET     | `/enseignants/:ppr`                   | directeur   | Un enseignant (dans son établissement) |
| GET     | `/absences`                           | directeur   | Toutes les absences de l'établissement |
| POST    | `/absence`                            | directeur   | Déclarer une absence |
| PUT     | `/absence/:id`                        | directeur   | Modifier une absence |
| DELETE  | `/absence/:id`                        | directeur   | Supprimer une absence |
| GET     | `/enseignant/:ppr/absences`           | directeur   | Historique absences d'un enseignant — query: `?start=&end=` |
| GET     | `/statistiques`                       | directeur   | Stats établissement (bySexe, heuresParEnseignant) — query: `?start=&end=` |
| GET     | `/statistiques/par-periode`           | directeur   | Stats matin/soir — query: `?start=&end=` |
| GET     | `/statistiques/absences-aujourd-hui`  | directeur   | Absents du jour (dans son établissement) |

---

## 7. Règles Métier

1. **Isolation Directeur** : Toutes les absences sont filtrées par `etaId` du JWT. Un directeur ne peut déclarer une absence que pour un enseignant appartenant à son établissement.
2. **Mise à jour automatique de `totalHeureAbsences`** : Lors de la création, mise à jour ou suppression d'une absence, le champ `totalHeureAbsences` de l'enseignant concerné est recalculé automatiquement.
3. **Période** : La valeur de `periode` doit être comprise entre 1 et 4 (heures). Valeur invalide → HTTP 400.
4. **Heure de début** : Si `heureDebut` n'est pas fourni, la valeur par défaut est `"09:00"` (matin) ou `"15:00"` (soir selon `quart`).
5. **ID Directeur auto-incrémenté** : Si `id` n'est pas fourni à la création, le système calcule `max(id) + 1`.
6. **Restriction Consultant** : Les consultants ont accès à tous les GET mais sont bloqués par `verifyRole` sur les routes POST/PUT/DELETE.
7. **`suppressReservedKeysWarning`** : Activé sur `AdminSchema` pour éviter les warnings Mongoose liés au champ `validate`.

---

## 8. Stack Technique

| Composant | Technologie |
|-----------|-------------|
| Runtime   | Node.js (ESM — `.mjs`) |
| Framework | Express.js |
| Base de données | MongoDB Atlas (Mongoose v9) |
| Auth      | `jsonwebtoken` (1h), `bcryptjs` (10 rounds) |
| Config    | `dotenv` — variable `DB` et `PORT` |
| CORS      | Origines autorisées : `http://localhost:5173` et `http://127.0.0.1:5173` |

---

## 9. Évolutions Futures

- Endpoint de signup pour les consultants (auto-inscription en attente de validation).
- Fonctionnalité de verrouillage/déverrouillage de journée.
- Export PDF/Excel des statistiques.
- Notifications email.
- Support multilingue (i18n).
