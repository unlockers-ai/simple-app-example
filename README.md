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
│ stocke dans SQLite (node:sqlite)                       │
└────────────────────────────────────────────────────────┘
```

## Démarrer

Prérequis : Node 24+, Docker.

```bash
docker compose up -d     # Keycloak sur http://localhost:8080 (≈ 15 s au premier démarrage)
npm install
npm run dev              # API sur :3000, front sur http://localhost:5173
```

Comptes de test (mot de passe = identifiant) :

| Utilisateur | Rôle     | Peut…                          |
| ----------- | -------- | ------------------------------ |
| `alice`     | `admin`  | lire, créer, modifier, supprimer |
| `eddie`     | `editor` | lire, créer, modifier          |
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

Keycloak tourne en mode dev (base H2 en mémoire) : **un redémarrage du conteneur réinitialise le realm**
à partir du JSON. Pour garder des changements faits dans la console, les exporter dans ce fichier.

> Avant une mise en production : `sslRequired` à `external`, changer le secret de `prompt-agent`,
> supprimer les utilisateurs de test, et faire tourner Keycloak en mode `start` avec une vraie base.

## Partir de ce modèle pour un nouveau projet

Sur GitHub : **Use this template**. Puis, en général :

- renommer le realm / les clients dans `keycloak/realm-simple-app.json` et les `.env.example` ;
- remplacer `backend/src/db.ts` et les routes de `backend/src/server.ts` par votre métier ;
- remplacer `PromptsPage` / `PromptCard` / `PromptDialog` côté front.
