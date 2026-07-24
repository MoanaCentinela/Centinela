# Infraestructura de Centinela

Este directorio contiene los scripts para aprovisionar, desplegar y destruir la infraestructura del sistema de prevención de fraude transaccional **Centinela** en Azure.

## Estructura de Archivos

- `variables.sh`: Configuración parametrizada del entorno de desarrollo.
- `provision.sh`: Script idempotente de creación de recursos en Azure (VNet, NSGs, Subredes, Storage Account, App Service, Managed Identity, Log Analytics y Application Insights).
- `deploy.sh`: Script para empaquetar y subir la API de ingesta a Azure App Service.
- `destroy.sh`: Script para limpiar y eliminar por completo el grupo de recursos y evitar cargos innecesarios de crédito.

## Requisitos previos

- Tener instalado [Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli) (versión mínima: `2.60.0`).
- Tener instalado `pnpm` (para empaquetar la aplicación).
- Haber iniciado sesión con `az login` y seleccionado la suscripción correcta con `az account set`.

## Instrucciones de Ejecución

### 1. Aprovisionamiento de Infraestructura
Para crear todos los recursos (o verificar su estado si ya existen):

```bash
cd infra/scripts/
./provision.sh
```

> **Nota de Idempotencia:** Este script es 100% idempotente. Su ejecución repetida no duplicará recursos ni generará errores; únicamente creará aquellos recursos que falten o estén desconfigurados.

### 2. Despliegue de la API
Para empaquetar la API de NodeJS e instalarla en el App Service:

```bash
cd infra/scripts/
./deploy.sh
```

### 3. Destrucción de Recursos (Fin de jornada)
Para apagar y eliminar los recursos del grupo para no consumir el saldo gratuito de Azure:

```bash
cd infra/scripts/
./destroy.sh
```
