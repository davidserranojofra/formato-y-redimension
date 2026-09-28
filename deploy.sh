#!/usr/bin/env bash
# Auto-deploy de redimensiona.devinventor.es
# Revisa origin/master; si hay cambios, reconstruye y levanta el contenedor.
set -euo pipefail
export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

REPO_DIR="/home/david/proyectos/formato-y-redimension"
cd "$REPO_DIR"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }

git fetch origin master --quiet

LOCAL="$(git rev-parse HEAD)"
REMOTE="$(git rev-parse origin/master)"

if [ "$LOCAL" = "$REMOTE" ]; then
  exit 0
fi

log "Cambios detectados ($LOCAL -> $REMOTE). Desplegando..."
git pull --ff-only origin master --quiet
docker compose up -d --build
log "Despliegue completado en $(git rev-parse --short HEAD)"
