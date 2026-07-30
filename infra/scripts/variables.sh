#!/bin/bash

set -euo pipefail

####################################################
# PROYECTO
####################################################

RESOURCE_GROUP="${RESOURCE_GROUP:-rg-centinela-dev}"
LOCATION="${LOCATION:-chilecentral}"

####################################################
# RED
####################################################

VNET_NAME="${VNET_NAME:-centinela-vnet-dev}"
VNET_ADDRESS="${VNET_ADDRESS:-10.0.0.0/16}"

APP_SUBNET="${APP_SUBNET:-centinela-snet-app-dev}"
APP_SUBNET_ADDRESS="${APP_SUBNET_ADDRESS:-10.0.1.0/24}"
APP_NSG="${APP_NSG:-centinela-nsg-app-dev}"

DATA_SUBNET="${DATA_SUBNET:-centinela-snet-data-dev}"
DATA_SUBNET_ADDRESS="${DATA_SUBNET_ADDRESS:-10.0.2.0/24}"
DATA_NSG="${DATA_NSG:-centinela-nsg-data-dev}"

FUTURE_SUBNET="${FUTURE_SUBNET:-centinela-snet-future-dev}"
FUTURE_SUBNET_ADDRESS="${FUTURE_SUBNET_ADDRESS:-10.0.3.0/24}"

####################################################
# APP SERVICE
####################################################

APP_SERVICE_PLAN="${APP_SERVICE_PLAN:-asp-centinela-dev}"
APP_SERVICE_NAME="${APP_SERVICE_NAME:-centinela-api-dev}"
APP_RUNTIME="${APP_RUNTIME:-NODE:22-lts}"

####################################################
# STORAGE
####################################################

STORAGE_ACCOUNT="${STORAGE_ACCOUNT:-stcentinela2607}"
BLOB_CONTAINER="${BLOB_CONTAINER:-raw-data}"
QUEUE_NAME="${QUEUE_NAME:-cola-transacciones}"

####################################################
# BASE DE DATOS SQL (ALMACÉN DE CASOS)
####################################################

# SQL_SERVER_NAME: Nombre del servidor SQL lógico (debe ser único en todo Azure)
SQL_SERVER_NAME="${SQL_SERVER_NAME:-sql-centinela-dev-001}"
# SQL_DB_NAME: Nombre de la base de datos relacional para el almacén de casos de fraude
SQL_DB_NAME="${SQL_DB_NAME:-CasosFraudeDB}"
# SQL_ADMIN_USER: Usuario administrador para la base de datos SQL
SQL_ADMIN_USER="${SQL_ADMIN_USER:-admincentinela}"
# SQL_ADMIN_PASSWORD: Contraseña para el usuario administrador de la base de datos SQL
SQL_ADMIN_PASSWORD="${SQL_ADMIN_PASSWORD:-PasswordSeguro123!}"

####################################################
# MONITOREO
####################################################

LOG_WORKSPACE="${LOG_WORKSPACE:-centinela-log-dev}"
APP_INSIGHTS="${APP_INSIGHTS:-centinela-appi-dev}"
