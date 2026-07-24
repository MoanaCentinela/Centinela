# Centinela — README de despliegue

Este documento resume cómo levantar la infraestructura base y la API de ingesta del proyecto Centinela.

## 1. Requisitos previos

- Azure CLI instalado y autenticado.
- Una suscripción activa en Azure.
- pnpm disponible en la máquina.

```bash
az login
az account set --subscription "<nombre-o-id-suscripción>"
```

## 2. Variables de entorno

Los valores base se definen en [infra/scripts/variables.sh](../infra/scripts/variables.sh). El flujo de scripts acepta sobrescrituras desde variables de entorno, por ejemplo:

```bash
RESOURCE_GROUP="rg-centinela-dev" \
LOCATION="chilecentral" \
./infra/scripts/provision.sh
```

## 3. Provisionamiento de infraestructura

Ejecutar desde la raíz del repositorio:

```bash
./infra/scripts/provision.sh
```

Este script crea o verifica:

- Resource Group
- Virtual Network y subredes
- Storage Account
- Blob Container y Queue
- App Service Plan
- Web App
- Managed Identity
- HTTPS Only
- Integración con la VNet

## 4. Despliegue de la API

```bash
./infra/scripts/deploy.sh
```

El script compila la API y la despliega con Azure App Service.

## 5. Eliminación de infraestructura

```bash
./infra/scripts/destroy.sh
```

Este script elimina el Resource Group completo tras confirmar la acción.

## 6. Ejecución local de la API

```bash
cd apps/api
pnpm install
pnpm run dev
```

La API queda disponible en http://localhost:3000.

## 7. Estructura relevante

```text
infra/scripts/
  provision.sh
  deploy.sh
  destroy.sh
  variables.sh
apps/api/
  src/
  package.json
```

## 8. Observaciones

- La configuración sensible debe mantenerse fuera del código y leerse desde variables de entorno o del propio entorno de Azure.
- Los scripts están diseñados para ser idempotentes y reutilizables.
- El endpoint de ingesta se encuentra en la API local y debe seguir separándose de la lógica de scoring, tal como lo define la arquitectura.