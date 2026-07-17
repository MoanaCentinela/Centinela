# Centinela — Tabla de Clasificación de Componentes

**Semana:** 1
**Propósito:** Identificar cada componente previsto del sistema a partir del recorrido de una transacción, determinando su modelo de servicio de nube y la distribución de responsabilidades entre la célula y Azure.

---

## 1. Los tres modelos de servicio (referencia rápida)

| Modelo | Qué administra Azure | Qué administra la célula |
|---|---|---|
| **IaaS** (Infrastructure as a Service) | Hardware físico, virtualización, red física | Sistema operativo, runtime, datos, aplicación, parches, escalado manual |
| **PaaS** (Platform as a Service) | Hardware, virtualización, SO, runtime, parcheo del sistema | Código de la aplicación, configuración, datos, escalado (configurable) |
| **SaaS** (Software as a Service) | Todo lo anterior + la aplicación misma | Solo configuración de uso y los datos que se introducen |

Ningún componente de Centinela usa IaaS puro (no se levantan máquinas virtuales gestionadas manualmente); el proyecto se apoya en PaaS y SaaS para minimizar la carga operativa dado el presupuesto y tiempo limitados.

---

## 2. Recorrido de la transacción → componentes identificados

Siguiendo el flujo: cliente/comercio → API de ingesta → validación → persistencia → (semana 2: scoring → alertas) → analista revisa → documento cargado.

| # | Componente | Modelo de servicio | Responsabilidad de Azure | Responsabilidad de la célula |
|---|---|---|---|---|
| 1 | **App Service** (API de ingesta) | PaaS | Runtime, parches del SO/framework, balanceo de carga, infraestructura de escalado | Código de la API, lógica de validación del contrato, configuración de la app, elección del nivel/plan correcto |
| 2 | **Virtual Network + Subredes** | PaaS (networking gestionado) | Infraestructura física de red, enrutamiento base | Diseño de topología, subredes, reglas de NSG, decisión de qué se conecta con qué |
| 3 | **Network Security Group (NSG)** | PaaS | Motor de aplicación de reglas | Definición de las reglas deny-by-default (origen, destino, puerto, justificación) |
| 4 | **Storage Account — Blob** (documentos de identidad) | PaaS | Durabilidad, redundancia física, disponibilidad del servicio | Nivel de acceso (privado), política de ciclo de vida, convención de nombres de objetos, validación de tipo/tamaño de archivo antes de subir |
| 5 | **Storage Queue** (cola de ingesta) | PaaS | Infraestructura de mensajería, durabilidad de los mensajes | Política de mensajes fallidos (dead-letter), diseño de qué eventos se publican y quién los consume |
| 6 | **Cosmos DB** (semana 2 — solo diseño conceptual esta semana) | PaaS | Motor de base de datos, replicación, escalado de throughput | Modelo de datos, índices, particionamiento, consultas |
| 7 | **Managed Identity** (identidad del rol Servicio) | PaaS (identidad gestionada) | Emisión y rotación de tokens/credenciales | Asignación de permisos RBAC correctos sobre esta identidad |
| 8 | **Azure AI Document Intelligence** (reconocimiento documental — verificado en informe de cuotas) | SaaS | El modelo de IA completo, su entrenamiento, su infraestructura de inferencia | Solo la integración (llamadas a la API) y el uso de sus resultados |
| 9 | **Application Insights / Log Analytics** | SaaS/PaaS | Recolección, almacenamiento e indexado de logs y métricas | Qué se instrumenta, qué alertas se configuran sobre esos datos |
| 10 | **Azure CLI / Script de aprovisionamiento** | Herramienta (no es un servicio en sí) | N/A | Todo — es responsabilidad 100% de la célula mantenerlo parametrizado, idempotente y versionado |
| 11 | **Suscripción de Azure** (límite de gasto, cuotas) | N/A (nivel de cuenta) | Infraestructura de facturación y cuotas por región | Configurar el límite de gasto, monitorear alertas de presupuesto, gestionar cuotas |

---

## 3. Por qué esta clasificación importa para el proyecto

- **PaaS es la elección dominante** porque el equipo tiene 21 días y presupuesto limitado: administrar sistemas operativos o parches (como exigiría IaaS) consumiría tiempo que no hay.
- La línea de responsabilidad más importante para el brief es la de **App Service**: Azure garantiza que el servicio corre y escala, pero **la célula es 100% responsable** de que la API no ejecute lógica de scoring esta semana (eso es una decisión de código, no de infraestructura).
- Para **Storage** y **Cosmos DB**, Azure garantiza durabilidad y disponibilidad, pero el aislamiento de red (Service Endpoints, ver documento de topología de red) es una configuración que la célula debe aplicar explícitamente — Azure no lo hace por defecto.

---

## 4. Pendiente de confirmación

- [ ] Confirmar con Dani la disponibilidad real de Azure AI Document Intelligence en la región elegida (informe de cuotas)
- [ ] Actualizar esta tabla en semana 2 cuando Cosmos DB pase de "diseño conceptual" a "desplegado"
