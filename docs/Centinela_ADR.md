# Centinela — Documento de Decisiones de Arquitectura (ADR)

**Estado:** Vivo — se actualiza en cada sprint (semanas 1, 2 y 3)
**Formato:** Cada decisión sigue la estructura Contexto → Decisión → Alternativas consideradas → Consecuencias

---

## Cómo usar este documento

Cada vez que el equipo tome una decisión de arquitectura relevante (una que sea costosa de revertir, o que afecte a más de una persona/componente), se agrega como una nueva entrada numerada (ADR-001, ADR-002...). Nunca se borran entradas viejas, aunque una decisión se reemplace: se agrega una nueva entrada que dice "reemplaza a ADR-00X" y se explica por qué.

---

## ADR-001 — Ambiente único: `dev`

**Contexto:** El brief establece que el proyecto no contempla entornos de staging con intercambio de despliegue, porque el nivel de servicio necesario para eso excede el presupuesto de la suscripción gratuita.

**Decisión:** Se define un único ambiente, nombrado `dev`, usado durante los 21 días del proyecto.

**Alternativas consideradas:** Nombrarlo `prod` (descartado: es un proyecto de aprendizaje, no un sistema en producción real).

**Consecuencias:** Todos los nombres de recursos incluyen el sufijo `-dev`. No hay proceso de promoción entre ambientes.

---

## ADR-002 — Región de despliegue

**Contexto:** La región debe soportar todos los servicios de las semanas 1–3 (incluyendo Azure AI Document Intelligence para reconocimiento documental), minimizar latencia y costo.

**Decisión:** `eastus` como propuesta inicial.

**Alternativas consideradas:** `westus2`, `westeurope`.

**Consecuencias:** **Pendiente de confirmación por Dani** tras el informe de cuotas — si Document Intelligence tiene cuota 0 en `eastus` para la suscripción real del equipo, esta decisión se reemplaza por una nueva entrada (ADR-00X) antes de que Dani ejecute el script de aprovisionamiento. El informe de cuotas condiciona esta decisión, no al revés.

---

## ADR-003 — Convención de nombres

**Contexto:** Se necesita un patrón consistente y documentado antes de que Dani escriba el script de aprovisionamiento, para evitar nombres hardcodeados dispersos por el código.

**Decisión:** Patrón `<proyecto>-<tipo-recurso>-<ambiente>`, con manejo especial (sufijo único, sin guiones) para recursos que requieren nombre único global (Storage Account, Key Vault, App Service). Detalle completo en `Centinela_Convencion_Nombres.md`.

**Alternativas consideradas:** Ninguna alternativa seria — es la convención estándar recomendada por Microsoft Cloud Adoption Framework, adaptada al proyecto.

**Consecuencias:** Todas las variables de nombres se declaran al inicio del script de aprovisionamiento, nunca repetidas en el cuerpo.

---

## ADR-004 — Topología de red: 3 subredes sobre una VNet `/16`

**Contexto:** El brief exige que los almacenes de datos no sean alcanzables desde internet, y que solo la subred de aplicación pueda acceder a ellos. Esta red debe soportar también los componentes de semanas 2 y 3, aunque se despliegue completa desde ahora.

**Decisión:** Una VNet (`10.0.0.0/16`) con tres subredes: `snet-app` (`10.0.1.0/24`), `snet-data` (`10.0.2.0/24`) y `snet-future` (`10.0.3.0/24`). Detalle completo en `Centinela_Topologia_Red.md`.

**Alternativas consideradas:** Subred de aplicación en el mínimo permitido por VNet Integration (`/28`) — descartada porque limitaría el escalado previsto en semana 3.

**Consecuencias:** La red se crea completa en semana 1 aunque los componentes de datos (Cosmos DB) se desplieguen recién en semana 2. Rediseñar esto después de tener datos persistidos sería más costoso.

---

## ADR-005 — Mecanismo de aislamiento de la capa de datos: Service Endpoints

**Contexto:** El brief pide usar el mecanismo de restricción de acceso por subred que ofrece la plataforma **sin costo adicional**.

**Decisión:** Se usa **Service Endpoints** (no Private Endpoints) para restringir el acceso a Storage/Cosmos DB únicamente desde `snet-app`.

**Alternativas consideradas:** Private Endpoints — ofrecen aislamiento más fuerte (IP privada dedicada, sin salir a la red pública de Azure) pero tienen costo por hora y por GB procesado, incompatible con el presupuesto de <20 USD/semana.

**Consecuencias:** El tráfico hacia Storage/Cosmos DB sigue viajando por el backbone público de Azure, pero el firewall del recurso solo acepta conexiones desde `snet-app`. Si en semana 3 el presupuesto lo permite, se puede reevaluar Private Endpoints (nueva entrada ADR-00X).

---

## ADR-006 — Modelo RBAC: 4 roles con separación de plano de control/datos

**Contexto:** El brief exige aplicar principio de menor privilegio y distinguir explícitamente entre permisos de plano de control y de plano de datos.

**Decisión:** 4 roles (Analista, Administrador, Servicio, Auditor), cada permiso derivado de una operación de negocio concreta y documentado en una matriz. Detalle completo en `Centinela_RBAC_Matriz.md`.

**Alternativas consideradas:** Usar roles integrados de Azure directamente sin revisión (ej. "Contributor") — descartado porque estos roles suelen combinar plano de control y de datos sin dejarlo explícito, violando el principio de menor privilegio.

**Consecuencias:** El rol Servicio se autentica vía identidad administrada (sin credenciales gestionadas por el equipo). Las asignaciones de rol se crean desde el script de aprovisionamiento, para que sean reproducibles.

---

## ADR-007 — Identidad del rol Servicio: Managed Identity, no claves

**Contexto:** El brief prohíbe explícitamente credenciales administradas por la célula para el rol Servicio, y prohíbe claves de acceso o connection strings embebidas para la carga de documentos.

**Decisión:** La API de ingesta usa una **System-Assigned Managed Identity**, con permisos otorgados vía RBAC directamente sobre Storage, Cosmos DB (semana 2) y la Queue.

**Alternativas consideradas:** Connection strings almacenadas en configuración de aplicación — descartada explícitamente por el brief y por buenas prácticas de seguridad (una credencial filtrada da acceso total, sin rotación automática).

**Consecuencias:** No hay ninguna clave de acceso ni cadena de conexión con credenciales en el código ni en el repositorio. Azure gestiona la rotación de forma transparente.

---

## Pendiente de nuevas entradas (semana 1, aún sin decidir)

- [ ] ADR-008 — Nivel de servicio del App Service Plan (justificación de costo) — pendiente de Maribel/Dani
- [ ] ADR-009 — Decisiones del contrato de la transacción (timestamp, tipo de dato para monto, formato de ubicación, identificador) — pendiente de Vale/Maribel
- [ ] ADR-010 — Tipo de cola elegida (Queue Storage vs. Service Bus) y si Event Hub se mantiene o se reemplaza — pendiente de decisión de equipo con Dani
- [ ] ADR-011 — Nivel de redundancia y política de ciclo de vida del contenedor de documentos — pendiente de Dani/Mary
