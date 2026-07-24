#!/bin/bash

set -e

az config set extension.use_dynamic_install=yes_without_prompt >/dev/null

source ./infra/scripts/variables.sh

echo "========================================"
echo "CENTINELA - PROVISIONAMIENTO"
echo "========================================"

############################################################
# RESOURCE GROUP
############################################################

echo ""
echo "Verificando Resource Group..."

if az group exists --name $RESOURCE_GROUP | grep true >/dev/null
then
    echo "✓ Resource Group ya existe."
else

    echo "Creando Resource Group..."

    az group create \
        --name $RESOURCE_GROUP \
        --location $LOCATION

fi

############################################################
# VNET
############################################################

echo ""
echo "Verificando VNet..."

if az network vnet show \
    --resource-group $RESOURCE_GROUP \
    --name $VNET_NAME >/dev/null 2>&1
then
    echo "✓ VNet ya existe."
else

    echo "Creando VNet..."

    az network vnet create \
        --resource-group $RESOURCE_GROUP \
        --name $VNET_NAME \
        --address-prefix $VNET_ADDRESS

fi

############################################################
# SUBRED APP
############################################################

echo ""
echo "Verificando Subred App..."

if az network vnet subnet show \
    --resource-group $RESOURCE_GROUP \
    --vnet-name $VNET_NAME \
    --name $APP_SUBNET >/dev/null 2>&1
then

    echo "✓ Subred App ya existe."

else

    echo "Creando Subred App..."

    az network vnet subnet create \
        --resource-group $RESOURCE_GROUP \
        --vnet-name $VNET_NAME \
        --name $APP_SUBNET \
        --address-prefixes $APP_SUBNET_ADDRESS

fi

############################################################
# SUBRED DATA
############################################################

echo ""
echo "Verificando Subred Data..."

if az network vnet subnet show \
    --resource-group $RESOURCE_GROUP \
    --vnet-name $VNET_NAME \
    --name $DATA_SUBNET >/dev/null 2>&1
then

    echo "✓ Subred Data ya existe."

else

    echo "Creando Subred Data..."

    az network vnet subnet create \
        --resource-group $RESOURCE_GROUP \
        --vnet-name $VNET_NAME \
        --name $DATA_SUBNET \
        --address-prefixes $DATA_SUBNET_ADDRESS

fi

############################################################
# SUBRED FUTURE
############################################################

echo ""
echo "Verificando Subred Future..."

if az network vnet subnet show \
    --resource-group $RESOURCE_GROUP \
    --vnet-name $VNET_NAME \
    --name $FUTURE_SUBNET >/dev/null 2>&1
then

    echo "✓ Subred Future ya existe."

else

    echo "Creando Subred Future..."

    az network vnet subnet create \
        --resource-group $RESOURCE_GROUP \
        --vnet-name $VNET_NAME \
        --name $FUTURE_SUBNET \
        --address-prefixes $FUTURE_SUBNET_ADDRESS

fi

############################################################
# NETWORK SECURITY GROUPS (NSG)
############################################################

echo ""
echo "Verificando NSG de Aplicación ($APP_NSG)..."

if az network nsg show --resource-group $RESOURCE_GROUP --name $APP_NSG >/dev/null 2>&1
then
    echo "✓ NSG de Aplicación ya existe."
else
    echo "Creando NSG de Aplicación..."
    az network nsg create \
        --resource-group $RESOURCE_GROUP \
        --name $APP_NSG \
        --location $LOCATION >/dev/null

    echo "Configurando reglas del NSG de Aplicación..."
    # Inbound: Allow HTTPS from Internet
    az network nsg rule create \
        --resource-group $RESOURCE_GROUP \
        --nsg-name $APP_NSG \
        --name Allow-HTTPS-Inbound \
        --priority 100 \
        --direction Inbound \
        --access Allow \
        --protocol Tcp \
        --source-address-prefixes Internet \
        --source-port-ranges "*" \
        --destination-address-prefixes "*" \
        --destination-port-ranges 443 >/dev/null

    # Inbound: Deny All
    az network nsg rule create \
        --resource-group $RESOURCE_GROUP \
        --nsg-name $APP_NSG \
        --name Deny-All-Inbound \
        --priority 65500 \
        --direction Inbound \
        --access Deny \
        --protocol "*" \
        --source-address-prefixes "*" \
        --source-port-ranges "*" \
        --destination-address-prefixes "*" \
        --destination-port-ranges "*" >/dev/null

    # Outbound: Allow AAD (for Managed Identity)
    az network nsg rule create \
        --resource-group $RESOURCE_GROUP \
        --nsg-name $APP_NSG \
        --name Allow-AAD-Outbound \
        --priority 100 \
        --direction Outbound \
        --access Allow \
        --protocol Tcp \
        --source-address-prefixes "*" \
        --source-port-ranges "*" \
        --destination-address-prefixes AzureActiveDirectory \
        --destination-port-ranges 443 >/dev/null

    # Outbound: Allow Storage
    az network nsg rule create \
        --resource-group $RESOURCE_GROUP \
        --nsg-name $APP_NSG \
        --name Allow-Storage-Outbound \
        --priority 110 \
        --direction Outbound \
        --access Allow \
        --protocol Tcp \
        --source-address-prefixes "*" \
        --source-port-ranges "*" \
        --destination-address-prefixes Storage \
        --destination-port-ranges 443 >/dev/null

    # Outbound: Allow CosmosDB
    az network nsg rule create \
        --resource-group $RESOURCE_GROUP \
        --nsg-name $APP_NSG \
        --name Allow-CosmosDB-Outbound \
        --priority 120 \
        --direction Outbound \
        --access Allow \
        --protocol Tcp \
        --source-address-prefixes "*" \
        --source-port-ranges "*" \
        --destination-address-prefixes AzureCosmosDB \
        --destination-port-ranges "443,10250-10255" >/dev/null

    # Outbound: Allow Azure Monitor
    az network nsg rule create \
        --resource-group $RESOURCE_GROUP \
        --nsg-name $APP_NSG \
        --name Allow-Monitor-Outbound \
        --priority 130 \
        --direction Outbound \
        --access Allow \
        --protocol Tcp \
        --source-address-prefixes "*" \
        --source-port-ranges "*" \
        --destination-address-prefixes AzureMonitor \
        --destination-port-ranges 443 >/dev/null

    # Outbound: Deny All
    az network nsg rule create \
        --resource-group $RESOURCE_GROUP \
        --nsg-name $APP_NSG \
        --name Deny-All-Outbound \
        --priority 65500 \
        --direction Outbound \
        --access Deny \
        --protocol "*" \
        --source-address-prefixes "*" \
        --source-port-ranges "*" \
        --destination-address-prefixes "*" \
        --destination-port-ranges "*" >/dev/null
fi

echo ""
echo "Verificando NSG de Datos ($DATA_NSG)..."

if az network nsg show --resource-group $RESOURCE_GROUP --name $DATA_NSG >/dev/null 2>&1
then
    echo "✓ NSG de Datos ya existe."
else
    echo "Creando NSG de Datos..."
    az network nsg create \
        --resource-group $RESOURCE_GROUP \
        --name $DATA_NSG \
        --location $LOCATION >/dev/null

    echo "Configurando reglas del NSG de Datos..."
    # Inbound: Allow from App Subnet only
    az network nsg rule create \
        --resource-group $RESOURCE_GROUP \
        --nsg-name $DATA_NSG \
        --name Allow-App-Subnet-Inbound \
        --priority 100 \
        --direction Inbound \
        --access Allow \
        --protocol Tcp \
        --source-address-prefixes $APP_SUBNET_ADDRESS \
        --source-port-ranges "*" \
        --destination-address-prefixes $DATA_SUBNET_ADDRESS \
        --destination-port-ranges "443,10250-10255" >/dev/null

    # Inbound: Deny All
    az network nsg rule create \
        --resource-group $RESOURCE_GROUP \
        --nsg-name $DATA_NSG \
        --name Deny-All-Inbound \
        --priority 65500 \
        --direction Inbound \
        --access Deny \
        --protocol "*" \
        --source-address-prefixes "*" \
        --source-port-ranges "*" \
        --destination-address-prefixes "*" \
        --destination-port-ranges "*" >/dev/null

    # Outbound: Deny All
    az network nsg rule create \
        --resource-group $RESOURCE_GROUP \
        --nsg-name $DATA_NSG \
        --name Deny-All-Outbound \
        --priority 65500 \
        --direction Outbound \
        --access Deny \
        --protocol "*" \
        --source-address-prefixes "*" \
        --source-port-ranges "*" \
        --destination-address-prefixes "*" \
        --destination-port-ranges "*" >/dev/null
fi

# Associate NSGs with Subnets
echo ""
echo "Asociando NSGs a las subredes..."

az network vnet subnet update \
    --resource-group $RESOURCE_GROUP \
    --vnet-name $VNET_NAME \
    --name $APP_SUBNET \
    --network-security-group $APP_NSG >/dev/null

az network vnet subnet update \
    --resource-group $RESOURCE_GROUP \
    --vnet-name $VNET_NAME \
    --name $DATA_SUBNET \
    --network-security-group $DATA_NSG >/dev/null

############################################################
# STORAGE ACCOUNT
############################################################

echo ""
echo "Verificando Storage..."

if az storage account show \
    --resource-group $RESOURCE_GROUP \
    --name $STORAGE_ACCOUNT >/dev/null 2>&1
then

    echo "✓ Storage ya existe."

else

    echo "Creando Storage..."

    az storage account create \
        --name $STORAGE_ACCOUNT \
        --resource-group $RESOURCE_GROUP \
        --location $LOCATION \
        --sku Standard_LRS

fi

############################################################
# CONNECTION STRING
############################################################

echo ""
echo "Obteniendo Connection String..."

CONNECTION_STRING=$(az storage account show-connection-string \
    --name $STORAGE_ACCOUNT \
    --resource-group $RESOURCE_GROUP \
    --query connectionString \
    -o tsv)

############################################################
# BLOB
############################################################

echo ""
echo "Verificando Blob..."

if az storage container exists \
    --name $BLOB_CONTAINER \
    --connection-string "$CONNECTION_STRING" \
    --query exists \
    -o tsv | grep true >/dev/null
then

    echo "✓ Blob ya existe."

else

    echo "Creando Blob..."

    az storage container create \
        --name $BLOB_CONTAINER \
        --connection-string "$CONNECTION_STRING" \
        --public-access off

fi

############################################################
# QUEUE
############################################################

echo ""
echo "Verificando Queue..."

if az storage queue exists \
    --name $QUEUE_NAME \
    --connection-string "$CONNECTION_STRING" \
    --query exists \
    -o tsv | grep true >/dev/null
then

    echo "✓ Queue ya existe."

else

    echo "Creando Queue..."

    az storage queue create \
        --name $QUEUE_NAME \
        --connection-string "$CONNECTION_STRING"

fi

############################################################
# STORAGE FIREWALL & SERVICE ENDPOINTS
############################################################

echo ""
echo "Habilitando Service Endpoints en la Subred de Aplicación..."

az network vnet subnet update \
    --resource-group $RESOURCE_GROUP \
    --vnet-name $VNET_NAME \
    --name $APP_SUBNET \
    --service-endpoints Microsoft.Storage >/dev/null

echo "Configurando firewall del Storage Account..."

az storage account update \
    --name $STORAGE_ACCOUNT \
    --resource-group $RESOURCE_GROUP \
    --default-action Deny >/dev/null

az storage account network-rule add \
    --resource-group $RESOURCE_GROUP \
    --account-name $STORAGE_ACCOUNT \
    --vnet-name $VNET_NAME \
    --subnet $APP_SUBNET >/dev/null

############################################################
# APP SERVICE PLAN
############################################################

echo ""
echo "Verificando App Service Plan..."

if az appservice plan show \
    --resource-group $RESOURCE_GROUP \
    --name $APP_SERVICE_PLAN >/dev/null 2>&1
then

    echo "✓ App Service Plan ya existe."

else

    echo "Creando App Service Plan..."

    az appservice plan create \
        --name $APP_SERVICE_PLAN \
        --resource-group $RESOURCE_GROUP \
        --location $LOCATION \
        --sku B1 \
        --is-linux

fi

############################################################
# WEB APP
############################################################

echo ""
echo "Verificando Web App..."

if az webapp show \
    --resource-group $RESOURCE_GROUP \
    --name $APP_SERVICE_NAME >/dev/null 2>&1
then

    echo "✓ Web App ya existe."

else

    echo "Creando Web App..."

    az webapp create \
        --resource-group $RESOURCE_GROUP \
        --plan $APP_SERVICE_PLAN \
        --name $APP_SERVICE_NAME \
        --runtime "$APP_RUNTIME"

fi

############################################################
# MANAGED IDENTITY
############################################################

echo ""
echo "Activando Managed Identity..."

az webapp identity assign \
    --resource-group $RESOURCE_GROUP \
    --name $APP_SERVICE_NAME >/dev/null

echo "Asignando roles RBAC a la Managed Identity del App Service..."

PRINCIPAL_ID=$(az webapp identity show \
    --resource-group $RESOURCE_GROUP \
    --name $APP_SERVICE_NAME \
    --query principalId \
    -o tsv)

STORAGE_ID=$(az storage account show \
    --resource-group $RESOURCE_GROUP \
    --name $STORAGE_ACCOUNT \
    --query id \
    -o tsv)

az role assignment create \
    --assignee-object-id $PRINCIPAL_ID \
    --role "Storage Blob Data Contributor" \
    --scope $STORAGE_ID \
    --assignee-principal-type ServicePrincipal >/dev/null 2>&1 || true

az role assignment create \
    --assignee-object-id $PRINCIPAL_ID \
    --role "Storage Queue Data Message Sender" \
    --scope $STORAGE_ID \
    --assignee-principal-type ServicePrincipal >/dev/null 2>&1 || true

############################################################
# HTTPS
############################################################

echo ""
echo "Configurando HTTPS Only..."

az webapp update \
    --resource-group $RESOURCE_GROUP \
    --name $APP_SERVICE_NAME \
    --https-only true >/dev/null

############################################################
# VNET INTEGRATION
############################################################

echo ""
echo "Verificando integración con la VNet..."

VNET_STATUS=$(az webapp vnet-integration list \
    --resource-group $RESOURCE_GROUP \
    --name $APP_SERVICE_NAME \
    --query "[?name=='$APP_SUBNET'] | length(@)" \
    -o tsv)

if [ "$VNET_STATUS" = "1" ]
then

    echo "✓ La Web App ya está integrada."

else

    echo "Integrando Web App con la VNet..."

    az webapp vnet-integration add \
        --resource-group $RESOURCE_GROUP \
        --name $APP_SERVICE_NAME \
        --vnet $VNET_NAME \
        --subnet $APP_SUBNET

fi

############################################################
# MONITOREO (LOG ANALYTICS & APP INSIGHTS)
############################################################

echo ""
echo "Verificando Workspace de Log Analytics ($LOG_WORKSPACE)..."

if az monitor log-analytics workspace show \
    --resource-group $RESOURCE_GROUP \
    --workspace-name $LOG_WORKSPACE >/dev/null 2>&1
then
    echo "✓ Log Analytics Workspace ya existe."
else
    echo "Creando Workspace de Log Analytics..."
    az monitor log-analytics workspace create \
        --resource-group $RESOURCE_GROUP \
        --workspace-name $LOG_WORKSPACE \
        --location $LOCATION >/dev/null
fi

echo ""
echo "Verificando Application Insights ($APP_INSIGHTS)..."

if az monitor app-insights component show \
    --app $APP_INSIGHTS \
    --resource-group $RESOURCE_GROUP >/dev/null 2>&1
then
    echo "✓ Application Insights ya existe."
else
    echo "Creando Application Insights..."
    az monitor app-insights component create \
        --app $APP_INSIGHTS \
        --location $LOCATION \
        --resource-group $RESOURCE_GROUP \
        --workspace $LOG_WORKSPACE >/dev/null
fi

echo ""
echo "Configurando Application Insights en la Web App..."

APP_INSIGHTS_KEY=$(az monitor app-insights component show \
    --app $APP_INSIGHTS \
    --resource-group $RESOURCE_GROUP \
    --query connectionString \
    -o tsv)

az webapp config appsettings set \
    --name $APP_SERVICE_NAME \
    --resource-group $RESOURCE_GROUP \
    --settings APPLICATIONINSIGHTS_CONNECTION_STRING="$APP_INSIGHTS_KEY" >/dev/null

echo ""
echo "========================================"
echo "INFRAESTRUCTURA LISTA"
echo "========================================"