# Prompt Library — simple-app-example

Petite application d'exemple **React + Node.js (TypeScript)** protégée par **OIDC via Keycloak**.
Elle sert de point de départ pour de petits projets : on clone (ou « Use this template »), et on remplace le métier.

Le sujet : une bibliothèque de prompts partagée entre l'équipe et des agents.

```
┌────────────┐  login OIDC (code + PKCE)  ┌──────────────┐
│  Frontend  │ ─────────────────────────▶ │   Keycloak   │  utilisateurs, rôles,
│ React/Vite │ ◀───── access token ────── │   (Docker)   │  Google, service accounts
└─────┬──────┘                            └──────┬───────┘
      │ Authorization: Bearer <token>            │ JWKS (clés publiques)
      ▼                                          ▼
┌────────────────────────────────────────────────────────┐
│ Backend Express : vérifie le JWT, contrôle les rôles,  │
│ stocke dans Postgres                                   │
└────────────────────────────────────────────────────────┘
```

## Démarrer

Prérequis : Node 24+, Docker.

```bash
docker compose up -d     # Keycloak sur :8080 (≈ 15 s au premier démarrage) + Postgres sur :5432
npm install
npm run dev              # API sur :3000, front sur http://localhost:5173
```

Comptes de test (mot de passe = identifiant) :

| Utilisateur | Rôle     | Peut…                          |
| ----------- | -------- | ------------------------------ |
| `emilie`    | `admin`  | lire, créer, modifier, supprimer |
| `sarah`     | `editor` | lire, créer, modifier          |
| `victor`    | `viewer` | lire                           |

Console d'admin Keycloak : http://localhost:8080/admin (`admin` / `admin`), realm **simple-app**.

## Rôles et permissions

Les rôles sont des *realm roles* Keycloak, composites : `admin` ⊃ `editor` ⊃ `viewer`.
Ils arrivent dans le token (`realm_access.roles`) et le backend les vérifie avec `requireRole(...)` :

| Route                        | Rôle requis |
| ---------------------------- | ----------- |
| `GET /api/prompts[/:id]`     | `viewer`    |
| `POST /api/prompts`          | `editor`    |
| `PUT /api/prompts/:id`       | `editor`    |
| `DELETE /api/prompts/:id`    | `admin`     |

Tout nouvel utilisateur (inscription ou Google) reçoit `viewer` par défaut.

## Service account (agents)

Le client `prompt-agent` est un service account avec le rôle `editor`. Un agent obtient un token
en *client credentials* puis appelle l'API comme n'importe quel utilisateur :

```bash
./scripts/agent-demo.sh
```

Pour un nouvel agent : Keycloak → Clients → Create client → *Client authentication* ON,
*Service accounts roles* ON → onglet *Service accounts roles* pour lui donner un rôle.
Pensez à lui ajouter le mapper d'audience `simple-app-api` (voir le client `prompt-agent`).

## Connexion avec Google

1. Dans Google Cloud Console → *APIs & Services → Credentials*, créer un *OAuth client ID* (Web).
   URI de redirection : `http://localhost:8080/realms/simple-app/broker/google/endpoint`
2. Keycloak → realm simple-app → *Identity providers* → **Google** → coller Client ID / Secret.

Le bouton « Google » apparaît alors sur la page de login ; les comptes sont créés au premier login.

## Configuration

Tout a des valeurs par défaut pour le dev ; voir `backend/.env.example` et `frontend/.env.example`.
La configuration Keycloak (realm, rôles, clients, utilisateurs de test) est dans
`keycloak/realm-simple-app.json`, importée au démarrage du conteneur. Le thème de la page de login
est dans `keycloak/themes/prompt-library`.

Le fichier de realm contient des variables `${NOM:valeur-par-défaut}` (URL de l'app, mots de passe
des comptes de test, secret de l'agent) : en dev les valeurs par défaut s'appliquent, en prod elles
viennent du `.env` du serveur.

En dev, Keycloak tourne en mode `start-dev` (base H2 interne) : **recréer le conteneur réinitialise
le realm** à partir du JSON (`docker compose up -d --force-recreate keycloak`). Pour garder des
changements faits dans la console, les reporter dans ce fichier.

## Production

En ligne sur **https://example-app.unlockers.ai**, sur le serveur unlockers.ai (Hetzner).

```bash
./deploy/deploy.sh
```

Le script copie le code par `rsync` vers `~/example-app` sur le serveur (alias ssh `unlockers`), puis
lance `docker compose -f docker-compose.prod.yml up -d --build`. Trois conteneurs :

| Conteneur              | Rôle                                                        |
| ---------------------- | ----------------------------------------------------------- |
| `example-app-web`      | API Node qui sert aussi le front compilé (voir `Dockerfile`) |
| `example-app-keycloak` | Keycloak en mode production, servi sous `/auth`             |
| `example-app-postgres` | Postgres : base `app` pour l'API, base `keycloak`           |

- **HTTPS et routage** : le Caddy partagé du serveur, configuré dans le dépôt
  `unlockers-ai/unlockers-infra` (`caddy/config/sites/example-app.caddy`). Le certificat
  Let's Encrypt est automatique ; le DNS `*.unlockers.ai` pointe déjà sur le serveur.
- **Secrets** : générés au premier déploiement dans `~/example-app/.env` sur le serveur, jamais
  commités (mot de passe Postgres, admin Keycloak, secret de l'agent, mots de passe des comptes de
  test). Pour les lire : `ssh unlockers cat example-app/.env`.
- **Console d'admin** : https://example-app.unlockers.ai/auth/admin (`admin` / `KC_ADMIN_PASSWORD`).
- **Le realm n'est importé qu'au premier démarrage** : ensuite il vit dans Postgres, et les
  modifications du JSON ne s'appliquent plus en prod. Les faire dans la console (et les reporter
  dans le JSON pour le dev).
- **Agent en prod** : `KEYCLOAK=https://example-app.unlockers.ai/auth/realms/simple-app
  API=https://example-app.unlockers.ai/api CLIENT_SECRET=… ./scripts/agent-demo.sh`

## Partir de ce modèle pour un nouveau projet

Sur GitHub : **Use this template**. Puis, en général :

- renommer le realm / les clients dans `keycloak/realm-simple-app.json` et les `.env.example` ;
- remplacer `backend/src/db.ts` et les routes de `backend/src/server.ts` par votre métier ;
- remplacer `PromptsPage` / `PromptCard` / `PromptDialog` côté front ;
- pour le déploiement : changer `DEPLOY_DIR`, `APP_URL` et les noms de conteneurs `example-app-*`
  (`docker-compose.prod.yml`, `deploy/deploy.sh`), et ajouter le fichier Caddy correspondant
  dans `unlockers-infra`.
