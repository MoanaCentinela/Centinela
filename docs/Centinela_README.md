# Centinela — README de Despliegue (Semana 1)

Este documento resume cómo levantar la infraestructura base, configurar la seguridad e iniciar la API de ingesta del proyecto **Centinela** en Azure y en local.

---

## 1. Requisitos previos

- [ ] Cuenta de Azure con una suscripción activa (con límite de gasto activo).
- [x] [Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli) instalado (versión mínima: `2.60.0`).
- [ ] Sesión iniciada en CLI: `az login`.
- [ ] Suscripción correcta seleccionada: `az account set --subscription "<nombre-o-id-suscripción>"`.
- [ ] Permisos de **Administrador** (rol definido en la matriz RBAC) para poder ejecutar el script de aprovisionamiento.
- [ ] `pnpm` instalado localmente en la máquina.

---

## 2. Variables de entorno / Parámetros del script

Todos los valores base se definen centralizados en [infra/scripts/variables.sh](../infra/scripts/variables.sh). El flujo de scripts acepta sobrescrituras desde variables de entorno, por ejemplo:

```bash
RESOURCE_GROUP="rg-centinela-dev" \
LOCATION="chilecentral" \
./infra/scripts/provision.sh
```

---

## 3. Aprovisionamiento de infraestructura

Para crear, configurar y asegurar toda la infraestructura en la nube, ejecuta desde la raíz del repositorio:

```bash
./infra/scripts/provision.sh
```

Este script es **idempotente** y creará de forma ordenada:
1. Resource Group
2. Virtual Network + subredes (`centinela-snet-app-dev`, `centinela-snet-data-dev`, `centinela-snet-future-dev`)
3. Network Security Groups (`centinela-nsg-app-dev` y `centinela-nsg-data-dev`) con reglas cerradas por defecto (*deny-by-default*).
4. Storage Account (Blob + Queue) con **Service Endpoints** habilitados desde la subred de aplicación.
5. App Service Plan + App Service (API de ingesta) con integración a la VNet.
6. Managed Identity asignada al App Service con accesos RBAC (*Storage Blob Data Contributor* y *Storage Queue Data Message Sender*) sobre el almacenamiento seguro.
7. Log Analytics Workspace y Application Insights para monitoreo.

---

## 4. Despliegue de la API en Azure

Para empaquetar y subir el backend de NodeJS a Azure App Service, ejecuta:

```bash
./infra/scripts/deploy.sh
```

---

## 5. Ejecución local de la API (Desarrollo)

Para levantar la API localmente en tu computadora:

```bash
cd apps/api
pnpm install
pnpm run dev
```

La API quedará disponible para pruebas en `http://localhost:3000`.

---

## 6. Pruebas Funcionales y de Aislamiento

Una vez desplegada en Azure, se debe verificar el flujo completo de la ingesta:

### 6.1 Enviar una transacción válida (esperado: 202 Accepted)
```bash
curl -X POST https://<nombre-app-service>.azurewebsites.net/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "transactionId": "123e4567-e89b-12d3-a456-426614174000",
    "accountId": "ACC-987654",
    "amount": 25000, 
    "currency": "USD",
    "clientTimestamp": "2026-07-19T14:30:00Z", 
    "location": {
      "latitude": 6.2442,
      "longitude": -75.5812
    },
    "merchant": {
      "id": "MERCH-102",
      "category": "ELECTRONICS"
    }
  }'
```

### 6.2 Enviar una transacción inválida (esperado: 400 Bad Request)
```bash
curl -X POST https://<nombre-app-service>.azurewebsites.net/transactions \
  -H "Content-Type: application/json" \
  -d '{"amount": -100}'
```

### 6.3 Verificar el aislamiento de la capa de datos
Desde una máquina o red **fuera** de la VNet (ej. tu laptop sin VPN):
```bash
curl https://<nombre-storage-account>.blob.core.windows.net/raw-data
```
*Resultado esperado:* **403 Forbidden** (Acceso denegado por las reglas de red del Storage Account).

### 6.4 Verificar el Control de Tasa (Rate Limiting) (esperado: 429 Too Many Requests)
La API cuenta con protección contra abuso por medio del plugin oficial `@fastify/rate-limit`, limitando a un máximo de **100 peticiones por minuto por IP de origen**.

Para comprobar el límite localmente, puedes enviar una ráfaga rápida de 101 peticiones:
* En **PowerShell (Windows)**:
  ```powershell
  for ($i=1; $i -le 101; $i++) { curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3000/transactions }
  ```
* En **Bash (Linux/Mac)**:
  ```bash
  for i in {1..101}; do curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3000/transactions; done
  ```

*Resultado esperado:* Las primeras 100 responderán con `400` (o `202`/`200` si usas payloads válidos) y la petición 101 responderá con **429 (Too Many Requests)** y una estructura de error estandarizada:
```json
{
  "success": false,
  "message": "Límite de peticiones excedido. Por favor, intente de nuevo más tarde.",
  "errors": [
    "Límite: 100 peticiones",
    "Ventana: 1 minute"
  ],
  "statusCode": 429
}
```

---

## 7. Eliminación de infraestructura (Cierre de jornada)

Para evitar el consumo de créditos de Azure fuera del horario de trabajo:

```bash
./infra/scripts/destroy.sh
```

Este script destruirá por completo el Resource Group y detendrá los costos activos.

---

## 8. Estructura relevante del repositorio

```text
├── infra/
│   ├── README.md           # Notas de idempotencia e instrucciones técnicas
│   └── scripts/
│       ├── variables.sh    # Parámetros centralizados del entorno
│       ├── provision.sh    # Script de aprovisionamiento idempotente
│       ├── deploy.sh       # Empaquetado y despliegue del App Service
│       └── destroy.sh      # Script de destrucción y limpieza
├── apps/
│   └── api/                # API de ingesta (Fastify + TypeScript)
├── docs/
│   ├── Centinela_ADR.md    # Decisiones de Arquitectura
│   ├── Centinela_Topologia_Red.md # Diseño de Red y reglas de tráfico
│   └── ...
└── README.md
```

---

## 9. Validación de cierre completa

Antes de dar la semana por concluida, el equipo ejecuta:
1. Eliminar el grupo de recursos completo (`destroy.sh`)
2. Ejecutar `provision.sh` sobre la suscripción vacía
3. Completar el despliegue de la aplicación (`deploy.sh`)
4. Repetir las pruebas de consumo de la API (secciones 6.1 a 6.3)
5. Verificar en Application Insights la llegada de telemetría

- [ ] Nombre real del Resource Group, App Service, Storage Account (una vez el script defina el sufijo único)
- [x] Versión mínima de Azure CLI requerida (`2.60.0`)
- [x] Contenido real de `infra/README.md` con notas de idempotencia
- [ ] Ejemplo de payload de transacción alineado al contrato final (Vale/Maribel)
