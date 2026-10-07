# Architecture

Quatre schémas pour comprendre l'application : les briques, la connexion d'un utilisateur,
l'accès d'un agent, et ce qui tourne en production.

## 1. Les briques

Trois briques : le **front** (ce que voit l'utilisateur), l'**API** (les données et les règles),
et **Keycloak** (qui est qui, et qui a le droit de faire quoi). Le front et l'API ne gèrent jamais
de mot de passe : ils font confiance aux tokens signés par Keycloak.

```mermaid
flowchart LR
    user([👤 Utilisateur<br/>navigateur])
    agent([🤖 Agent<br/>script, LLM…])

    subgraph app [Application]
        front[Frontend<br/>React + Vite]
        api[API<br/>Node.js + Express]
        db[(Postgres<br/>base app)]
    end

    kc[Keycloak<br/>utilisateurs · rôles · clients]
    google[Google<br/>optionnel]

    user --> front
    front -- "login (redirection)" --> kc
    kc -. "fédération d'identité" .-> google
    front -- "appels /api + token" --> api
    agent -- "token client credentials" --> kc
    agent -- "appels /api + token" --> api
    api -- "vérifie la signature<br/>(clés publiques JWKS)" --> kc
    api --> db
```

## 2. Connexion d'un utilisateur (OIDC, code + PKCE)

Le front n'affiche jamais de formulaire de mot de passe : il redirige vers Keycloak, qui renvoie
un code, échangé contre un token. L'API vérifie ensuite ce token à chaque appel.

```mermaid
sequenceDiagram
    actor U as Utilisateur
    participant F as Frontend
    participant K as Keycloak
    participant A as API

    U->>F: Ouvre l'app, clique « Se connecter »
    F->>K: Redirection vers la page de login (+ PKCE)
    U->>K: Identifiant + mot de passe (ou Google)
    K->>F: Redirection avec un code à usage unique
    F->>K: Échange le code contre un access token
    K-->>F: Token signé (sub, nom, rôles, audience)
    F->>A: GET /api/prompts<br/>Authorization: Bearer token
    A->>A: Vérifie signature, émetteur, audience<br/>et le rôle requis
    A-->>F: 200 + données (ou 401 / 403)
```

## 3. Rôles et permissions

Les rôles sont définis dans Keycloak et voyagent dans le token. Ils sont **composites** : un admin
est aussi editor, qui est aussi viewer. L'API vérifie le rôle sur chaque route ; le front se
contente de masquer les boutons inutiles.

```mermaid
flowchart TB
    admin[admin<br/>supprimer] --> editor[editor<br/>créer · modifier] --> viewer[viewer<br/>lire]

    emilie([Émilie]) -.-> admin
    sarah([Sarah]) -.-> editor
    agent([prompt-agent<br/>service account]) -.-> editor
    victor([Victor]) -.-> viewer
    nouveau([Tout nouvel inscrit<br/>ou compte Google]) -.-> viewer
```

## 4. Un agent appelle l'API (service account)

Un agent n'a pas de navigateur : il s'authentifie avec l'identifiant et le secret de son client
Keycloak (*client credentials*) et reçoit un token comme un utilisateur, avec ses propres rôles.

```mermaid
sequenceDiagram
    participant G as Agent
    participant K as Keycloak
    participant A as API

    G->>K: POST /token<br/>client_id + client_secret
    K-->>G: Access token (rôle editor)
    G->>A: POST /api/prompts + token
    A-->>G: 201 Créé
    G->>A: DELETE /api/prompts/1 + token
    A-->>G: 403 (admin requis)
```

## 5. En production

Tout tourne sur le serveur unlockers.ai (Hetzner), en conteneurs Docker. Le Caddy partagé
(dépôt `unlockers-infra`) termine le HTTPS et route selon le chemin. Un push sur `main`
redéploie l'app via GitHub Actions.

```mermaid
flowchart LR
    dev([💻 git push main]) --> gha[GitHub Actions<br/>typecheck · rsync · docker compose]
    gha -- ssh --> server

    internet(["🌍 https://example-app.unlockers.ai"]) --> caddy

    subgraph server [Serveur unlockers.ai]
        caddy[Caddy partagé<br/>HTTPS Let's Encrypt]

        subgraph web [réseau docker « web »]
            webapp[example-app-web<br/>API + front compilé<br/>:3000]
            kc[example-app-keycloak<br/>:8080 sous /auth]
        end

        subgraph internal [réseau interne]
            pg[(example-app-postgres<br/>bases app + keycloak)]
        end

        caddy -- "/auth/*" --> kc
        caddy -- "tout le reste" --> webapp
        webapp --> pg
        kc --> pg
    end
```

| Où                                    | Quoi                                                     |
| ------------------------------------- | -------------------------------------------------------- |
| `docker-compose.yml`                  | Dev local : Keycloak + Postgres                          |
| `docker-compose.prod.yml`, `Dockerfile` | Prod : les trois conteneurs                            |
| `deploy/deploy.sh`                    | rsync + `docker compose up` (lancé par GitHub Actions)   |
| `keycloak/realm-simple-app.json`      | Rôles, clients, comptes de test                          |
| `unlockers-infra` → `caddy/config/sites/example-app.caddy` | Le routage HTTPS                    |
