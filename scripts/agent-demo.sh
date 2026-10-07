#!/usr/bin/env bash
# Démo service account : un "agent" obtient un token (client credentials) puis appelle l'API.
set -euo pipefail

KEYCLOAK=${KEYCLOAK:-http://localhost:8080/realms/simple-app}
API=${API:-http://localhost:3000/api}
CLIENT_ID=${CLIENT_ID:-prompt-agent}
CLIENT_SECRET=${CLIENT_SECRET:-agent-secret-change-me}

TOKEN=$(curl -sf -X POST "$KEYCLOAK/protocol/openid-connect/token" \
  -d grant_type=client_credentials -d client_id="$CLIENT_ID" -d client_secret="$CLIENT_SECRET" |
  node -e 'process.stdin.on("data", d => console.log(JSON.parse(d).access_token))')

echo "→ Qui suis-je ?"
curl -sf "$API/me" -H "Authorization: Bearer $TOKEN"; echo

echo "→ Liste des prompts"
curl -sf "$API/prompts" -H "Authorization: Bearer $TOKEN" | node -e 'process.stdin.on("data", d => JSON.parse(d).forEach(p => console.log(` - [${p.id}] ${p.title}`)))'

echo "→ Création d'un prompt (rôle editor)"
curl -sf -X POST "$API/prompts" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"title":"Ajouté par l’agent","content":"Ce prompt a été créé via un service account.","tags":["agent"]}'; echo

echo "→ Tentative de suppression (rôle admin requis, doit échouer en 403)"
curl -s -o /dev/null -w "HTTP %{http_code}\n" -X DELETE "$API/prompts/1" -H "Authorization: Bearer $TOKEN"
