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

echo "========================================"
echo "CENTINELA - PROVISIONAMIENTO"
echo "========================================"

echo ""
echo "Usando recursos con:"
echo "  Resource Group: $RESOURCE_GROUP"
echo "  Ubicación: $LOCATION"

############################################################
# RESOURCE GROUP
############################################################

echo ""
echo "Verificando Resource Group..."

if az group exists --name "$RESOURCE_GROUP" | grep -q true
then
    echo "✓ Resource Group ya existe."
else
    echo "Creando Resource Group..."
    az group create \
        --name "$RESOURCE_GROUP" \
        --location "$LOCATION"
fi

############################################################
# VNET
############################################################

echo ""
echo "Verificando VNet..."

if az network vnet show \
    --resource-group "$RESOURCE_GROUP" \
    --name "$VNET_NAME" >/dev/null 2>&1
then
    echo "✓ VNet ya existe."
else
    echo "Creando VNet..."
    az network vnet create \
        --resource-group "$RESOURCE_GROUP" \
        --name "$VNET_NAME" \
        --address-prefix "$VNET_ADDRESS"
fi

############################################################
# SUBRED APP
############################################################

echo ""
echo "Verificando Subred App..."

if az network vnet subnet show \
    --resource-group "$RESOURCE_GROUP" \
    --vnet-name "$VNET_NAME" \
    --name "$APP_SUBNET" >/dev/null 2>&1
then
    echo "✓ Subred App ya existe."
else
    echo "Creando Subred App..."
    az network vnet subnet create \
        --resource-group "$RESOURCE_GROUP" \
        --vnet-name "$VNET_NAME" \
        --name "$APP_SUBNET" \
        --address-prefixes "$APP_SUBNET_ADDRESS"
fi

############################################################
# SUBRED DATA
############################################################

echo ""
echo "Verificando Subred Data..."

if az network vnet subnet show \
    --resource-group "$RESOURCE_GROUP" \
    --vnet-name "$VNET_NAME" \
    --name "$DATA_SUBNET" >/dev/null 2>&1
then
    echo "✓ Subred Data ya existe."
else
    echo "Creando Subred Data..."
    az network vnet subnet create \
        --resource-group "$RESOURCE_GROUP" \
        --vnet-name "$VNET_NAME" \
        --name "$DATA_SUBNET" \
        --address-prefixes "$DATA_SUBNET_ADDRESS"
fi

############################################################
# SUBRED FUTURE
############################################################

echo ""
echo "Verificando Subred Future..."

if az network vnet subnet show \
    --resource-group "$RESOURCE_GROUP" \
    --vnet-name "$VNET_NAME" \
    --name "$FUTURE_SUBNET" >/dev/null 2>&1
then
    echo "✓ Subred Future ya existe."
else
    echo "Creando Subred Future..."
    az network vnet subnet create \
        --resource-group "$RESOURCE_GROUP" \
        --vnet-name "$VNET_NAME" \
        --name "$FUTURE_SUBNET" \
        --address-prefixes "$FUTURE_SUBNET_ADDRESS"
fi

############################################################
# STORAGE ACCOUNT
############################################################

echo ""
echo "Verificando Storage..."

if az storage account show \
    --resource-group "$RESOURCE_GROUP" \
    --name "$STORAGE_ACCOUNT" >/dev/null 2>&1
then
    echo "✓ Storage ya existe."
else
    echo "Creando Storage..."
    az storage account create \
        --name "$STORAGE_ACCOUNT" \
        --resource-group "$RESOURCE_GROUP" \
        --location "$LOCATION" \
        --sku Standard_LRS
fi

############################################################
# CONNECTION STRING
############################################################

echo ""
echo "Obteniendo Connection String..."

CONNECTION_STRING=$(az storage account show-connection-string \
    --name "$STORAGE_ACCOUNT" \
    --resource-group "$RESOURCE_GROUP" \
    --query connectionString \
    -o tsv)

############################################################
# BLOB
############################################################

echo ""
echo "Verificando Blob..."

if az storage container exists \
    --name "$BLOB_CONTAINER" \
    --connection-string "$CONNECTION_STRING" \
    --query exists \
    -o tsv | grep -q true
then
    echo "✓ Blob ya existe."
else
    echo "Creando Blob..."
    az storage container create \
        --name "$BLOB_CONTAINER" \
        --connection-string "$CONNECTION_STRING" \
        --public-access off
fi

############################################################
# QUEUE
############################################################

echo ""
echo "Verificando Queue..."

if az storage queue exists \
    --name "$QUEUE_NAME" \
    --connection-string "$CONNECTION_STRING" \
    --query exists \
    -o tsv | grep -q true
then
    echo "✓ Queue ya existe."
else
    echo "Creando Queue..."
    az storage queue create \
        --name "$QUEUE_NAME" \
        --connection-string "$CONNECTION_STRING"
fi

############################################################
# APP SERVICE PLAN
############################################################

echo ""
echo "Verificando App Service Plan..."

if az appservice plan show \
    --resource-group "$RESOURCE_GROUP" \
    --name "$APP_SERVICE_PLAN" >/dev/null 2>&1
then
    echo "✓ App Service Plan ya existe."
else
    echo "Creando App Service Plan..."
    az appservice plan create \
        --name "$APP_SERVICE_PLAN" \
        --resource-group "$RESOURCE_GROUP" \
        --location "$LOCATION" \
        --sku B1 \
        --is-linux
fi

############################################################
# WEB APP
############################################################

echo ""
echo "Verificando Web App..."

if az webapp show \
    --resource-group "$RESOURCE_GROUP" \
    --name "$APP_SERVICE_NAME" >/dev/null 2>&1
then
    echo "✓ Web App ya existe."
else
    echo "Creando Web App..."
    az webapp create \
        --resource-group "$RESOURCE_GROUP" \
        --plan "$APP_SERVICE_PLAN" \
        --name "$APP_SERVICE_NAME" \
        --runtime "$APP_RUNTIME"
fi

############################################################
# MANAGED IDENTITY
############################################################

echo ""
echo "Activando Managed Identity..."

az webapp identity assign \
    --resource-group "$RESOURCE_GROUP" \
    --name "$APP_SERVICE_NAME" >/dev/null

############################################################
# HTTPS
############################################################

echo ""
echo "Configurando HTTPS Only..."

az webapp update \
    --resource-group "$RESOURCE_GROUP" \
    --name "$APP_SERVICE_NAME" \
    --https-only true >/dev/null

############################################################
# VNET INTEGRATION
############################################################

echo ""
echo "Verificando integración con la VNet..."

VNET_STATUS=$(az webapp vnet-integration list \
    --resource-group "$RESOURCE_GROUP" \
    --name "$APP_SERVICE_NAME" \
    --query "[?name=='$APP_SUBNET'] | length(@)" \
    -o tsv)

if [ "$VNET_STATUS" = "1" ]
then
    echo "✓ La Web App ya está integrada."
else
    echo "Integrando Web App con la VNet..."
    az webapp vnet-integration add \
        --resource-group "$RESOURCE_GROUP" \
        --name "$APP_SERVICE_NAME" \
        --vnet "$VNET_NAME" \
        --subnet "$APP_SUBNET"
fi

echo ""
echo "========================================"
echo "INFRAESTRUCTURA LISTA"
echo "========================================"