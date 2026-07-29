#!/bin/bash

set -euo pipefail

# Configura Azure CLI para que instale automáticamente cualquier extensión requerida
# (por ejemplo, para Application Insights) sin interrumpir la ejecución con preguntas interactivas.
az config set extension.use_dynamic_install=yes_without_prompt >/dev/null

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
# GRUPOS DE SEGURIDAD DE RED (NSG)
# Implementación de la política de seguridad perimetral "deny-by-default"
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
    
    # Entrada: Permitir tráfico HTTPS desde Internet (Puerto 443)
    # Permite que la API de ingesta reciba transacciones legítimas de los clientes/comercios.
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

    # Entrada: Denegar todo por defecto
    # Asegura que ningún otro puerto de la subred de aplicación sea expuesto a internet.
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

    # Salida: Permitir conexión a Microsoft Entra ID (Active Directory)
    # Requerido para la autenticación basada en tokens de la Identidad Administrada de la Web App.
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

    # Salida: Permitir conexión a Azure Storage
    # Habilita el tráfico saliente desde la Web App hacia las colas y blobs del Storage Account.
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

    # Salida: Permitir conexión a Azure Cosmos DB (Semana 2)
    # Abre los puertos necesarios para la comunicación con la base de datos documental.
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

    # Salida: Permitir conexión a Azure Monitor / Application Insights
    # Habilita el envío dinámico de logs, métricas y telemetría de auditoría.
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

    # Salida: Denegar todo por defecto
    # Evita que el código de la API realice descargas externas o exfiltre información no controlada.
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
    
    # Entrada: Permitir únicamente tráfico desde la subred de aplicación
    # Aísla la base de datos y almacenamiento de cualquier origen que no sea la API autorizada.
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

    # Entrada: Denegar todo por defecto
    # Requerimiento no negociable del brief: capa de datos incomunicada desde internet pública.
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

    # Salida: Denegar todo por defecto
    # Los recursos en la subred de datos nunca inician tráfico saliente; solo responden a peticiones autorizadas.
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

# Asociación de NSGs con sus subredes correspondientes
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
# FIREWALL DEL ALMACENAMIENTO Y SERVICE ENDPOINTS
# Configuración del aislamiento de red para la capa de datos
############################################################

echo ""
echo "Habilitando Service Endpoints en la Subred de Aplicación..."

# Habilita el Service Endpoint en la subred de aplicación para permitir
# que el tráfico hacia Azure Storage viaje seguro por el backbone de Azure
# y pueda ser identificado por el firewall del Storage Account.
az network vnet subnet update \
    --resource-group "$RESOURCE_GROUP" \
    --vnet-name "$VNET_NAME" \
    --name "$APP_SUBNET" \
    --service-endpoints Microsoft.Storage >/dev/null

echo "Configurando firewall del Storage Account..."

# Cambia la acción por defecto a 'Deny' para bloquear cualquier acceso
# desde la red de Internet pública a nuestra Storage Account.
az storage account update \
    --name "$STORAGE_ACCOUNT" \
    --resource-group "$RESOURCE_GROUP" \
    --default-action Deny >/dev/null

# Agrega la regla de red para autorizar el acceso exclusivamente
# desde la subred de aplicación (donde se ejecuta la API de ingesta).
az storage account network-rule add \
    --resource-group "$RESOURCE_GROUP" \
    --account-name "$STORAGE_ACCOUNT" \
    --vnet-name "$VNET_NAME" \
    --subnet "$APP_SUBNET" >/dev/null

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
# FUNCTION APP (MOTOR DE SCORING)
############################################################

echo ""
echo "Verificando Function App..."

if az functionapp show \
    --resource-group "$RESOURCE_GROUP" \
    --name "$FUNCTION_APP_NAME" >/dev/null 2>&1
then
    echo "✓ Function App ya existe."
else
    echo "Creando Function App..."
    az functionapp create \
        --resource-group "$RESOURCE_GROUP" \
        --name "$FUNCTION_APP_NAME" \
        --storage-account "$STORAGE_ACCOUNT" \
        --consumption-plan-location "$LOCATION" \
        --runtime node \
        --runtime-version 20 \
        --functions-version 4 \
        --os-type Linux
fi

############################################################
# IDENTIDAD ADMINISTRADA (MANAGED IDENTITY) Y ROLES RBAC
# Cumplimiento del principio de menor privilegio y "cero secretos en código"
############################################################

echo ""
echo "Activando Managed Identity..."

# Activa la identidad asignada por el sistema (System-Assigned Managed Identity) en el App Service.
# Esto crea una identidad en Microsoft Entra ID para la Web App sin necesidad de contraseñas.
az webapp identity assign \
    --resource-group "$RESOURCE_GROUP" \
    --name "$APP_SERVICE_NAME" >/dev/null

echo "Asignando roles RBAC a la Managed Identity del App Service..."

# Obtiene el identificador principal (ObjectId) de la identidad del App Service.
PRINCIPAL_ID=$(az webapp identity show \
    --resource-group "$RESOURCE_GROUP" \
    --name "$APP_SERVICE_NAME" \
    --query principalId \
    -o tsv)

# Obtiene el ID del recurso del Storage Account para limitar el ámbito de los permisos.
STORAGE_ID=$(az storage account show \
    --resource-group "$RESOURCE_GROUP" \
    --name "$STORAGE_ACCOUNT" \
    --query id \
    -o tsv)

# Asigna el rol "Storage Blob Data Contributor" (permite lectura/escritura de blobs) a la API.
# Se usa || true para hacer la operación idempotente si el rol ya está asignado.
az role assignment create \
    --assignee-object-id "$PRINCIPAL_ID" \
    --role "Storage Blob Data Contributor" \
    --scope "$STORAGE_ID" \
    --assignee-principal-type ServicePrincipal >/dev/null 2>&1 || true

# Asigna el rol "Storage Queue Data Message Sender" (permite enviar mensajes a la cola de ingesta) a la API.
az role assignment create \
    --assignee-object-id "$PRINCIPAL_ID" \
    --role "Storage Queue Data Message Sender" \
    --scope "$STORAGE_ID" \
    --assignee-principal-type ServicePrincipal >/dev/null 2>&1 || true

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

############################################################
# MONITOREO (LOG ANALYTICS & APP INSIGHTS)
############################################################

echo ""
echo "Verificando Workspace de Log Analytics ($LOG_WORKSPACE)..."

if az monitor log-analytics workspace show \
    --resource-group "$RESOURCE_GROUP" \
    --workspace-name "$LOG_WORKSPACE" >/dev/null 2>&1
then
    echo "✓ Log Analytics Workspace ya existe."
else
    echo "Creando Workspace de Log Analytics..."
    az monitor log-analytics workspace create \
        --resource-group "$RESOURCE_GROUP" \
        --workspace-name "$LOG_WORKSPACE" \
        --location "$LOCATION" >/dev/null
fi

echo ""
echo "Verificando Application Insights ($APP_INSIGHTS)..."

if az monitor app-insights component show \
    --app "$APP_INSIGHTS" \
    --resource-group "$RESOURCE_GROUP" >/dev/null 2>&1
then
    echo "✓ Application Insights ya existe."
else
    echo "Creando Application Insights..."
    az monitor app-insights component create \
        --app "$APP_INSIGHTS" \
        --location "$LOCATION" \
        --resource-group "$RESOURCE_GROUP" \
        --workspace "$LOG_WORKSPACE" >/dev/null
fi

echo ""
echo "Configurando Application Insights en la Web App..."

APP_INSIGHTS_KEY=$(az monitor app-insights component show \
    --app "$APP_INSIGHTS" \
    --resource-group "$RESOURCE_GROUP" \
    --query connectionString \
    -o tsv)

az webapp config appsettings set \
    --name "$APP_SERVICE_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --settings APPLICATIONINSIGHTS_CONNECTION_STRING="$APP_INSIGHTS_KEY" >/dev/null

echo ""
echo "========================================"
echo "INFRAESTRUCTURA LISTA"
echo "========================================"

############################################################
# COSMOS DB (SEMANA 2)
############################################################

echo ""
echo "Verificando Cosmos DB..."

# Nota: Los nombres en Azure deben ser únicos globalmente. Si da error, cambia el '001'.
COSMOS_NAME="cosmos-centinela-dev-001" 

if az cosmosdb show --name "$COSMOS_NAME" --resource-group "$RESOURCE_GROUP" >/dev/null 2>&1
then
    echo "✓ Cosmos DB ya existe."
else
    echo "Creando Cosmos DB (Nivel Gratuito, Consistencia: Session)..."
    az cosmosdb create \
        --name "$COSMOS_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --enable-free-tier true \
        --default-consistency-level Session

    echo "Creando Base de Datos 'FraudeDB'..."
    az cosmosdb sql database create \
        --account-name "$COSMOS_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --name FraudeDB

    echo "Creando contenedor 'Transacciones' con Partición /accountId y TTL 30 días..."
    az cosmosdb sql container create \
        --account-name "$COSMOS_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --database-name FraudeDB \
        --name Transacciones \
        --partition-key-path "/accountId" \
        --default-ttl 2592000
fi

############################################################
# BASE DE DATOS SQL (SEMANA 2)
############################################################

echo ""
echo "Verificando Servidor SQL..."

SQL_SERVER_NAME="sql-centinela-dev-001"
SQL_DB_NAME="CasosFraudeDB"

if az sql server show --name "$SQL_SERVER_NAME" --resource-group "$RESOURCE_GROUP" >/dev/null 2>&1
then
    echo "✓ Servidor SQL ya existe."
else
    echo "Creando Servidor SQL Lógico..."
    az sql server create \
        --name "$SQL_SERVER_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --location "$LOCATION" \
        --admin-user "admincentinela" \
        --admin-password "PasswordSeguro123!"

    echo "Creando Base de Datos SQL..."
    az sql db create \
        --resource-group "$RESOURCE_GROUP" \
        --server "$SQL_SERVER_NAME" \
        --name "$SQL_DB_NAME" \
        --service-objective Basic

    echo "Bloqueando acceso a internet para el Servidor SQL..."
    az sql server update \
        --name "$SQL_SERVER_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --restrict-outbound-network-access true \
        --public-network-access Disabled
fi