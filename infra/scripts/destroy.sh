#!/bin/bash

set -e

source ./infra/scripts/variables.sh

echo "========================================"
echo "ELIMINAR INFRAESTRUCTURA"
echo "========================================"

read -p "¿Deseas eliminar toda la infraestructura? (y/n): " confirm

if [ "$confirm" != "y" ]; then
    echo "Operación cancelada."
    exit 0
fi

az group delete \
    --name $RESOURCE_GROUP \
    --yes \
    --no-wait

echo "El Resource Group se está eliminando en segundo plano."