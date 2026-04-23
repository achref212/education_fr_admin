# Education FR — Admin (Angular)

Application d’administration pour l’API `education_fr_api` (FastAPI).

## Prérequis

- Node 18+ / npm
- API en `http://localhost:8000` (voir `src/environments/environment.ts`)

## Démarrage

```bash
cd education_fr_admin
npm install
npm start
```

Ouvre `http://localhost:4200`. Connexion avec un compte dont le rôle est `admin` (créer le premier compte via `POST /admin/setup` sur l’API ou le script `education_fr_api/scripts/create_admin.py`).

## Build production

```bash
npm run build
```

## Proxy (optionnel)

`proxy.conf.json` redirige `/api` vers le backend en dev si vous pointez le client sur des URLs relatives (non utilisé par défaut : l’`apiUrl` est absolue).

## Stack

- Angular 19 (standalone)
- Angular Material
- ng2-charts + Chart.js (tableau de bord)
