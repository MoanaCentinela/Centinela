# Centinela — Sistema de Detección de Fraude Transaccional en Tiempo Real

Centinela es una plataforma financiera diseñada para auditar y evaluar transacciones en tiempo real mediante un motor de scoring heurístico sobre la nube de Microsoft Azure. Aplica una arquitectura desacoplada orientada a eventos (EDA) para responder al cliente en milisegundos acusando recibo (`202 Accepted`) y procesando la puntuación de riesgo de forma asíncrona.

---

## Tecnologías Utilizadas

### Backend (API REST & Scoring)
- **Node.js 20** (ES Modules)
- **TypeScript 5**
- **Fastify**: Framework de alto rendimiento para APIs REST.
- **Zod**: Validación estricta de esquemas de contratos de transacciones.
- **Vitest**: Suite de pruebas unitarias e integración de reglas de scoring.

### Frontend (Portal de Analistas)
- **React 18**
- **TypeScript**
- **Vite**: Bundler de compilación ultrarrápido para Single Page Applications.
- **Vanilla CSS**: Sistema de diseño responsive sin dependencias pesadas.

### Nube e Infraestructura (Azure PaaS & IaC)
- **Azure App Service (Linux PaaS)**: Servidor web de producción.
- **Azure App Service Plan (SKU B1)**: Cómputo administrado de bajo costo.
- **Azure Storage Queue**: Cola de mensajería asíncrona para absorción de picos.
- **Azure CLI (`az`)**: Scripts Bash para Infraestructura como Código (IaC).
- **GitHub Actions**: Pipeline CI/CD con autenticación OIDC (Workload Identity Federation).

---

## Arquitectura del Sistema

```text
[ Cliente / Tarjeta ] ──── (1. POST /transactions < 50ms) ────► [ API Ingesta Fastify ]
                                                                        │
                                                                 (2. Responde 202 Accepted)
                                                                        │
                                                                 (3. Publica Evento)
                                                                        ▼
                                                             [ Azure Storage Queue ]
                                                                        │
                                                                 (4. Queue Trigger)
                                                                        ▼
                                                             [ Motor Serverless Scoring ]
                                                                        │
                                                             (5. Score >= 60 Umbral)
                                                                        ▼
                                                             [ Expediente FraudCase ]
```

---

## Inicio Rápido y Desarrollo Local

### Prerrequisitos
- Node.js >= 20.x
- pnpm >= 10.x

### 1. Clonar el repositorio e instalar dependencias
```bash
git clone https://github.com/MoanaCentinela/Centinela.git
cd Centinela
pnpm install
```

### 2. Compilar el proyecto completo (Backend y Frontend)
```bash
pnpm --filter api build
pnpm --filter web build
```

### 3. Ejecutar la suite de pruebas unitarias e integración
```bash
pnpm --filter api test
```

### 4. Iniciar el servidor localmente
```bash
node apps/api/dist/server.js
```
El servidor quedará corriendo en `http://localhost:3000`. Al ingresar desde el navegador a esa URL, se servirá el portal web de analistas y los endpoints REST en `/transactions`, `/cases`, `/auth` y `/admin`.

---

## Estructura del Monorepo

```text
centinela/
├── .github/workflows/       # Pipeline CI/CD de GitHub Actions (deploy-api.yml)
├── apps/
│   ├── api/                 # Backend REST (Fastify, Reglas de Scoring y Gestión de Casos)
│   └── web/                 # Frontend Portal de Analistas (React + Vite)
├── docs/                    # Documentación técnica de arquitectura y contexto
├── infra/
│   └── scripts/             # Scripts IaC (provision.sh, deploy.sh, destroy.sh, variables.sh)
└── pnpm-workspace.yaml      # Configuración del monorepo
```

---

## Alcance y Estado del Proyecto

**Porcentaje Global de Cumplimiento**: **72%**

### Funcionalidades Implementadas (Logros)
- API de Ingesta en tiempo real (`POST /transactions`) con acuse asíncrono inmediato (`202 Accepted`).
- Control de tasa (Rate Limiting de 100 req/min) y detección de idempotencia por ID de transacción.
- Motor de Scoring Heurístico desacoplado con 4 reglas independientes:
  - `VelocityRule`: Frecuencia de transacciones en ventana de tiempo.
  - `AmountRule`: Monto atípico respecto al promedio histórico.
  - `ImpossibleGeoRule`: Desplazamiento geográfico físicamente imposible (Haversine > 900 km/h).
  - `RiskMerchantRule`: Evaluación por comercios o categorías de riesgo.
- Umbral dinámico (`SCORE_THRESHOLD`) y creación automática de expedientes con evidencia detallada.
- API REST de Gestión de Casos (`GET /cases`, `GET /cases/:id`, `PATCH /cases/:id/resolve`, `POST /cases/:id/documents`).
- Autenticación JWT y control de acceso basado en roles (`ADMIN`, `ANALYST`, `AUDITOR`).
- Portal Web para Analistas integrado en React.
- Infraestructura como Código (IaC) idempotente y despliegue CI/CD en GitHub Actions sobre Azure App Service.

### Pendientes de Entrega
- Desacoplamiento a Azure Function App serverless física con `QueueTrigger`.
- Formateador de plantilla determinista consolidado para el texto explicativo completo.
- Integración con el servicio Azure AI Document Intelligence para extracción OCR de cédulas.
- Tableros dedicados de observabilidad en Application Insights.

---

## Scripts de Infraestructura (`infra/scripts/`)

Los scripts leen sus parámetros desde `infra/scripts/variables.sh` y admiten sobrescritura desde variables de entorno:

- **Provisionamiento**: `./infra/scripts/provision.sh`
- **Despliegue Manual**: `./infra/scripts/deploy.sh`
- **Eliminación de Recursos**: `./infra/scripts/destroy.sh`

Ejemplo de ejecución personalizada:
```bash
RESOURCE_GROUP="rg-centinela-dev" LOCATION="chilecentral" ./infra/scripts/provision.sh
```

---

## Despliegue Continuo (CI/CD)

El pipeline se ejecuta automáticamente tras cada `push` a la rama `develop` (`.github/workflows/deploy-api.yml`).

- **Servicio en Producción**: `https://centinela-api-dev.azurewebsites.net`
- **Autenticación en Azure**: OIDC (Workload Identity Federation).
- **Parámetros de Runtime**: `ENABLE_ORYX_BUILD="false"` y `SCM_DO_BUILD_DURING_DEPLOYMENT="false"`.
