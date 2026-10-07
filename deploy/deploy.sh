#!/usr/bin/env bash
# Déploie l'app sur le serveur unlockers.ai : copie le code par rsync, puis (re)construit
# et relance les conteneurs avec docker compose. Au premier passage, génère les secrets
# dans ~/example-app/.env sur le serveur (jamais commités, conservés ensuite).
#
# Usage : ./deploy/deploy.sh   (nécessite l'alias ssh `unlockers` → deploy@167.233.206.232)
set -euo pipefail

HOST=${DEPLOY_HOST:-unlockers}
DIR=${DEPLOY_DIR:-example-app}
APP_URL=${APP_URL:-https://example-app.unlockers.ai}

cd "$(dirname "$0")/.."

rsync -az --delete \
  --exclude .git --exclude node_modules --exclude dist --exclude .env --exclude .nwave \
  ./ "$HOST:$DIR/"

ssh "$HOST" APP_URL="$APP_URL" DIR="$DIR" bash -s <<'REMOTE'
set -euo pipefail
cd ~/"$DIR"

if [ ! -f .env ]; then
  secret() { openssl rand -base64 24 | tr -d '/+='; }
  umask 077
  cat > .env <<ENV
APP_URL=$APP_URL
POSTGRES_PASSWORD=$(secret)
KC_ADMIN_PASSWORD=$(secret)
AGENT_CLIENT_SECRET=$(secret)
EMILIE_PASSWORD=$(secret)
SARAH_PASSWORD=$(secret)
VICTOR_PASSWORD=$(secret)
ENV
  echo "Secrets générés dans ~/$DIR/.env sur le serveur."
fi

docker compose -f docker-compose.prod.yml up -d --build --remove-orphans
docker image prune -f > /dev/null
docker compose -f docker-compose.prod.yml ps
REMOTE

echo "Déployé sur $APP_URL"
