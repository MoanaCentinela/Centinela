#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

source "$SCRIPT_DIR/variables.sh"

require_command() {
    if ! command -v "$1" >/dev/null 2>&1; then
        echo "ERROR: Falta la dependencia '$1'."
        exit 1
    fi
}

require_command az

echo "========================================"
echo "ELIMINAR INFRAESTRUCTURA"
echo "========================================"

read -p "¿Deseas eliminar toda la infraestructura? (y/n): " confirm

if [ "$confirm" != "y" ]; then
    echo "Operación cancelada."
    exit 0
fi

az group delete \
    --name "$RESOURCE_GROUP" \
    --yes \
    --no-wait

echo "El Resource Group se está eliminando en segundo plano."