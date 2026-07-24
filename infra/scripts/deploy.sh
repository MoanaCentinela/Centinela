#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

source "$SCRIPT_DIR/variables.sh"

require_command() {
    if ! command -v "$1" >/dev/null 2>&1; then
        echo "ERROR: Falta la dependencia '$1'."
        exit 1
    fi
}

require_command az
require_command pnpm

echo "========================================"
echo "DEPLOY CENTINELA"
echo "========================================"

cd "$REPO_ROOT/apps/api"

echo ""
echo "Instalando dependencias..."

pnpm install

echo ""
echo "Compilando..."

pnpm build

echo ""
echo "Configurando App Service para el arranque de la API..."

az webapp config appsettings set \
    --resource-group "$RESOURCE_GROUP" \
    --name "$APP_SERVICE_NAME" \
    --settings SCM_DO_BUILD_DURING_DEPLOYMENT=true \
    > /dev/null

az webapp config set \
    --resource-group "$RESOURCE_GROUP" \
    --name "$APP_SERVICE_NAME" \
    --startup-file "node dist/server.js" \
    > /dev/null

echo ""
echo "Desplegando aplicación desde la carpeta compilada..."

cd "$REPO_ROOT/apps/api"

az webapp up \
    --name "$APP_SERVICE_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --runtime "$APP_RUNTIME" \
    --os-type Linux \
    --sku B1 \
    > /dev/null

echo ""
echo "Deploy finalizado."