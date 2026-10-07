# CLAUDE.md

Application d'exemple : front React, back Node.js, auth OIDC Keycloak. Principe directeur : **KISS**.
En cas de doute, choisir la solution la plus simple et le moins de dépendances possible.

## Commandes

- `docker compose up -d` : Keycloak (http://localhost:8080, admin/admin) et Postgres (:5432, app/app)
- `npm run dev` : backend (:3000) et frontend (:5173) ensemble
- `npm run typecheck` : vérification TypeScript des deux workspaces
- `./scripts/agent-demo.sh` : appel de l'API avec le service account
- `./deploy/deploy.sh` : déploiement en prod sur https://example-app.unlockers.ai (voir README)

## Structure

- `backend/` : Express 5 exécuté directement par Node 24 (type stripping, pas de build). Les imports
  locaux gardent l'extension `.ts`. N'utiliser que la syntaxe TypeScript effaçable (pas d'`enum`,
  pas de `namespace` à runtime, pas de propriétés de paramètres).
  - `auth.ts` : vérification du JWT (jose + JWKS Keycloak), `requireRole('viewer'|'editor'|'admin')`
  - `db.ts` : Postgres via `pg`, requêtes SQL écrites à la main, schéma créé au démarrage (`initDb`)
  - `server.ts` : routes REST sous `/api`
- `frontend/` : Vite + React 19, `react-oidc-context` pour le login. Pas de routeur : non connecté →
  `Landing`, connecté → `PromptsPage`. Les appels API passent par `api.ts` (proxy Vite `/api` → :3000).
  Styles dans un seul `styles.css` avec variables CSS (tons clairs, Fraunces + Manrope).
- `keycloak/realm-simple-app.json` : la source de vérité de la config Keycloak (rôles, clients,
  utilisateurs de test). Toute modification de config Keycloak doit y être reportée.

## Conventions

- Les droits sont vérifiés **côté backend** ; le front ne fait que masquer les boutons.
- Rôles composites : `admin` ⊃ `editor` ⊃ `viewer` → vérifier un seul rôle suffit.
- Le token d'accès doit contenir l'audience `simple-app-api` (mapper sur chaque client).
- Textes de l'interface en français.
- Comptes de test : emilie (admin), sarah (editor), victor (viewer) ; en dev, mot de passe = identifiant.
- Prod : `docker-compose.prod.yml` + `Dockerfile` ; le HTTPS et le routage sont dans le dépôt
  `unlockers-infra` (Caddy partagé). Les secrets ne sont que dans `~/example-app/.env` sur le serveur.
