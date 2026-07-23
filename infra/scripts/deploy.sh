#!/bin/bash

set -e

source ./infra/scripts/variables.sh

echo "========================================"
echo "DEPLOY CENTINELA"
echo "========================================"

cd apps/api

echo ""
echo "Instalando dependencias..."

pnpm install

echo ""
echo "Compilando..."

pnpm build

echo ""
echo "Desplegando aplicación..."

az webapp up \
    --name $APP_SERVICE_NAME \
    --resource-group $RESOURCE_GROUP \
    --runtime "$APP_RUNTIME"

echo ""
echo "Deploy finalizado."