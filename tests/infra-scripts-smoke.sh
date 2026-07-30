#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

TEST_RESOURCE_GROUP="rg-centinela-test"
TEST_LOCATION="eastus"

export RESOURCE_GROUP="$TEST_RESOURCE_GROUP"
export LOCATION="$TEST_LOCATION"

source "$ROOT_DIR/infra/scripts/variables.sh"

if [ "$RESOURCE_GROUP" != "$TEST_RESOURCE_GROUP" ]; then
  echo "ERROR: RESOURCE_GROUP no fue sobrescrito por la variable de entorno."
  exit 1
fi

if [ "$LOCATION" != "$TEST_LOCATION" ]; then
  echo "ERROR: LOCATION no fue sobrescrito por la variable de entorno."
  exit 1
fi

echo "Smoke test de variables de infraestructura: OK"
