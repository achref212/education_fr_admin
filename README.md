# DELFy Admin — Education FR

Panel d’administration web pour la plateforme **DELFy** (apprentissage du français). Cette application Angular gère le contenu pédagogique, les utilisateurs et la supervision de l’écosystème connecté à l’API FastAPI [`education_fr_api`](../education_fr_api).

![Angular](https://img.shields.io/badge/Angular-19-red?logo=angular)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript)
![Material](https://img.shields.io/badge/Material-19-purple)

---

## Table des matières

- [Fonctionnalités](#fonctionnalités)
- [Stack technique](#stack-technique)
- [Architecture](#architecture)
- [Prérequis](#prérequis)
- [Démarrage rapide](#démarrage-rapide)
- [Créer un compte administrateur](#créer-un-compte-administrateur)
- [Configuration](#configuration)
- [Scripts npm](#scripts-npm)
- [Structure du projet](#structure-du-projet)
- [Modules & routes](#modules--routes)
- [Intégration API](#intégration-api)
- [Données métier](#données-métier)
- [Authentification](#authentification)
- [Build & déploiement](#build--déploiement)
- [Dépannage](#dépannage)
- [Projets liés](#projets-liés)

---

## Fonctionnalités

| Module | Route | Description |
|--------|-------|-------------|
| **Tableau de bord** | `/dashboard` | KPIs, graphiques (Chart.js), accès rapide aux modules |
| **Utilisateurs** | `/users` | CRUD utilisateurs (rôle, niveau, activation) |
| **Leçons** | `/lessons` | CRUD leçons par catégorie et niveau scolaire |
| **Quiz** | `/quiz-questions` | CRUD questions à choix multiples |
| **Histoires** | `/stories` | CRUD histoires interactives (texte + audio) |
| **Progression** | `/progress` | Consultation de la progression des élèves (lecture seule) |
| **Messages** | `/contact-messages` | Gestion des messages de contact (lu / non lu) |
| **Multijoueur** | `/multiplayer` | Supervision des salles multijoueur actives |

Autres capacités :

- Connexion sécurisée JWT (rôle `admin` requis)
- Bootstrap du premier admin via l’interface (`POST /admin/setup`)
- Thème clair / sombre persistant
- Guards de route (`adminAuthGuard`, `loginPageGuard`)
- Intercepteur HTTP pour l’en-tête `Authorization: Bearer`

---

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Framework | Angular 19 (standalone components) |
| UI | Angular Material |
| Graphiques | ng2-charts + Chart.js |
| HTTP | `@angular/common/http` + intercepteur JWT |
| Styles | SCSS |
| Backend | FastAPI (`education_fr_api`) |

---

## Architecture

```
education_fr_admin/
├── src/app/
│   ├── core/
│   │   ├── auth/           # AdminAuthService, guards
│   │   ├── constants/      # Niveaux, catégories
│   │   ├── http/           # ApiService, auth interceptor
│   │   ├── models/         # DTOs TypeScript
│   │   └── theme/          # ThemeService (light/dark)
│   ├── layout/             # MainLayout, Topbar, sidebar
│   ├── pages/              # Écrans fonctionnels (lazy-loaded)
│   └── shared/             # Composants réutilisables (dialogs, stat-card)
├── src/environments/       # apiUrl par environnement
└── proxy.conf.json         # Proxy dev `/api` → backend
```

Chaque page consomme l’API via `ApiService`, qui préfixe les requêtes avec `environment.apiUrl`.

---

## Prérequis

- **Node.js** 18+ et **npm**
- **API backend** en cours d’exécution sur `http://localhost:8000`
- Base de données PostgreSQL configurée côté API (voir README de `education_fr_api`)

---

## Démarrage rapide

### 1. Lancer l’API backend

```bash
cd ../education_fr_api
# Activer le venv, appliquer les migrations, puis :
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Vérifier : [http://localhost:8000/docs](http://localhost:8000/docs)

### 2. Lancer l’admin

```bash
cd education_fr_admin
npm install
npm start
```

Ouvrir : [http://localhost:4200](http://localhost:4200)

> `npm start` utilise la configuration **development** (source maps, `environment.development.ts`) et le proxy défini dans `proxy.conf.json`.

---

## Créer un compte administrateur

L’accès au panel est réservé aux utilisateurs avec `role = "admin"`.

### Option A — Interface web (premier admin uniquement)

1. Ouvrir `/login`
2. Onglet **Inscription**
3. Remplir le formulaire → appelle `POST /admin/setup`
4. Se connecter avec le même e-mail / mot de passe

> Cette route n’est disponible que tant qu’**aucun admin** n’existe en base.

### Option B — Script Python

```bash
cd ../education_fr_api
export DATABASE_URL="postgresql+psycopg2://..."
export SECRET_KEY="your-secret-key"

python scripts/create_admin.py \
  --email admin@example.com \
  --password "ChangeMe123!" \
  --first-name Admin \
  --last-name User \
  --level "2e année primaire"
```

### Option C — API directe

```bash
curl -X POST http://localhost:8000/admin/setup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "ChangeMe123!",
    "firstName": "Admin",
    "lastName": "User",
    "level": "2e année primaire"
  }'
```

---

## Configuration

### Environnements

| Fichier | Usage | `apiUrl` par défaut |
|---------|-------|---------------------|
| `src/environments/environment.development.ts` | `npm start` | `http://localhost:8000` |
| `src/environments/environment.ts` | `npm run build` (production) | `http://localhost:8000` |

Pour pointer vers un autre backend (staging, prod, IP locale) :

```typescript
// src/environments/environment.development.ts
export const environment = {
  production: false,
  apiUrl: 'http://192.168.1.10:8000',
};
```

### Proxy de développement

`proxy.conf.json` redirige `/api/*` vers `http://localhost:8000`.  
Par défaut, l’app utilise des URLs **absolues** via `environment.apiUrl`. Le proxy est utile si vous basculez `apiUrl` vers `/api`.

---

## Scripts npm

| Commande | Description |
|----------|-------------|
| `npm start` | Serveur de dev sur `http://localhost:4200` |
| `npm run build` | Build production → `dist/education_fr_admin/` |
| `npm run watch` | Build development en mode watch |
| `npm test` | Tests unitaires (Karma + Jasmine) |

---

## Structure du projet

```
src/app/pages/
├── dashboard/           # Stats + graphiques
├── users/               # Gestion utilisateurs
├── lessons/             # Leçons
├── quiz-questions/      # Questions de quiz
├── stories/             # Histoires
├── progress/            # Progression élèves
├── contact-messages/    # Messages contact
├── multiplayer/         # Salles multijoueur
└── login/               # Connexion + bootstrap admin
```

---

## Modules & routes

| Route | Guard | Lazy load |
|-------|-------|-----------|
| `/login` | `loginPageGuard` | ✅ |
| `/dashboard` | `adminAuthGuard` | ✅ |
| `/users` | `adminAuthGuard` | ✅ |
| `/lessons` | `adminAuthGuard` | ✅ |
| `/quiz-questions` | `adminAuthGuard` | ✅ |
| `/stories` | `adminAuthGuard` | ✅ |
| `/progress` | `adminAuthGuard` | ✅ |
| `/contact-messages` | `adminAuthGuard` | ✅ |
| `/multiplayer` | `adminAuthGuard` | ✅ |

---

## Intégration API

Toutes les routes admin exigent un JWT valide avec rôle `admin`.

| Méthode | Endpoint | Usage admin |
|---------|----------|-------------|
| `GET` | `/admin/stats` | Tableau de bord |
| `GET/POST/PUT/DELETE` | `/admin/users` | Utilisateurs |
| `GET/POST/PUT/DELETE` | `/admin/lessons` | Leçons |
| `GET/POST/PUT/DELETE` | `/admin/quiz-questions` | Quiz |
| `GET/POST/PUT/DELETE` | `/admin/stories` | Histoires |
| `GET` | `/admin/progress` | Progression (lecture seule) |
| `GET/PUT/DELETE` | `/admin/contact-messages` | Messages |
| `GET` | `/admin/multiplayer-rooms` | Salles multijoueur |
| `POST` | `/admin/setup` | Création du premier admin |
| `POST` | `/auth/login` | Connexion (retourne JWT) |

Documentation interactive : [http://localhost:8000/docs](http://localhost:8000/docs)

---

## Données métier

Constantes centralisées dans `src/app/core/constants/form-options.ts` :

**Niveaux scolaires (inscription / contenu)**

- 1ère année primaire
- 2e année primaire
- 3e année primaire
- 4e année primaire
- 5e année primaire
- 6e année primaire

**Catégories de leçons**

- Grammaire, Conjugaison, Orthographe, Vocabulaire, Lecture, Dictée

**Catégories de quiz**

- Grammaire, Conjugaison, Orthographe, Vocabulaire

---

## Authentification

```
┌─────────────┐     POST /auth/login      ┌──────────────┐
│ Login page  │ ─────────────────────────►│  FastAPI     │
└─────────────┘                           └──────────────┘
       │                                         │
       │  JWT + user (role=admin)                │
       ▼                                         │
 localStorage                                    │
  • efr_admin_token                              │
  • efr_admin_user                             │
       │                                         │
       ▼                                         │
 Toutes les requêtes /admin/* ───────────────────►│
 Authorization: Bearer <token>                  │
```

- Seuls les comptes `role: "admin"` peuvent accéder au panel.
- Déconnexion : suppression du token + redirection `/login`.

---

## Build & déploiement

```bash
npm run build
```

Artefacts générés dans `dist/education_fr_admin/browser/`.

Avant un déploiement production :

1. Mettre à jour `src/environments/environment.ts` avec l’URL API de production.
2. Configurer CORS côté API (`CORS_ORIGINS` dans `.env` de `education_fr_api`).
3. Servir les fichiers statiques via Nginx, Vercel, ou tout hébergeur SPA.

Exemple Nginx (SPA fallback) :

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

---

## Dépannage

| Problème | Cause probable | Solution |
|----------|----------------|----------|
| `NETWORK_ERROR` à la connexion | API arrêtée ou mauvaise URL | Vérifier `environment.apiUrl` et que l’API tourne sur le port 8000 |
| `Accès réservé aux administrateurs` | Compte `user`, pas `admin` | Promouvoir le compte ou en créer un via `/admin/setup` / script |
| `SETUP_DONE` à l’inscription | Un admin existe déjà | Utiliser l’onglet Connexion ou `create_admin.py` |
| `EMAIL_TAKEN` | E-mail déjà en base | Utiliser un autre e-mail |
| Erreur CORS | Origine non autorisée | Ajouter `http://localhost:4200` dans `CORS_ORIGINS` (API) |
| Graphiques vides | Pas de données en base | Créer des leçons / utilisateurs via le panel |

---

## Projets liés

| Projet | Rôle |
|--------|------|
| [`education_fr_api`](../education_fr_api) | Backend FastAPI (auth, contenu, admin, progress) |
| [`education_fr_app`](../education_fr_app) | Application mobile Flutter (élèves) |

---

## Licence

Projet privé — usage interne DELFy / Education FR.
