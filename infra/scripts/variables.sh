#!/bin/bash

####################################################
# PROYECTO
####################################################

RESOURCE_GROUP="rg-centinela-dev"

LOCATION="chilecentral"

####################################################
# RED
####################################################

VNET_NAME="centinela-vnet-dev"

VNET_ADDRESS="10.0.0.0/16"

APP_SUBNET="centinela-snet-app-dev"
APP_SUBNET_ADDRESS="10.0.1.0/24"

DATA_SUBNET="centinela-snet-data-dev"
DATA_SUBNET_ADDRESS="10.0.2.0/24"

FUTURE_SUBNET="centinela-snet-future-dev"
FUTURE_SUBNET_ADDRESS="10.0.3.0/24"

####################################################
# APP SERVICE
####################################################

APP_SERVICE_PLAN="asp-centinela-dev"

APP_SERVICE_NAME="centinela-api-dev"

APP_RUNTIME="NODE:22-lts"

####################################################
# STORAGE
####################################################

STORAGE_ACCOUNT="stcentinela2607"

BLOB_CONTAINER="raw-data"

QUEUE_NAME="cola-transacciones"