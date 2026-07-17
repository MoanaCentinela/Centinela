# Centinela — Convención de Nombres de Recursos

**Semana:** 1
**Estado:** Propuesta inicial — región sujeta a confirmación de Dani tras informe de cuotas

---

## 1. Contexto y decisiones base

| Decisión | Valor elegido | Justificación |
|---|---|---|
| Ambiente | `dev` | El brief indica explícitamente que no hay staging con intercambio de despliegue ("el nivel de servicio requerido excede el presupuesto"). Un único ambiente real existe durante los 21 días del proyecto. Se nombra `dev` en vez de `prod` porque es un proyecto de aprendizaje, no un sistema en producción real. |
| Región | `eastus` (propuesta) | Mayor disponibilidad histórica de servicios nuevos/preview (relevante para Azure AI Document Intelligence), costos entre los más bajos de la plataforma, y región por defecto de la mayoría de suscripciones gratuitas/estudiante. **Debe confirmarse con el informe de cuotas de Dani** — si Document Intelligence tiene cuota 0 en esta región para la suscripción del equipo, se reevalúa contra `westus2` o `westeurope`. |
| Proyecto | `centinela` | Nombre del sistema, tal como aparece en el brief. |

---

## 2. Patrón general

```
<proyecto>-<tipo-recurso>-<ambiente>[-<sufijo-numerico>]
```

- **proyecto**: siempre `centinela`
- **tipo-recurso**: abreviatura estándar del tipo de recurso (tabla en sección 3)
- **ambiente**: `dev` (único ambiente definido para este proyecto)
- **sufijo-numérico**: opcional, solo si se necesita más de una instancia del mismo tipo de recurso (`-01`, `-02`)

Todo en **minúsculas**, separado por **guiones** (`-`), sin espacios, sin tildes ni caracteres especiales.

---

## 3. Abreviaturas por tipo de recurso

| Recurso Azure | Abreviatura | Ejemplo de nombre completo |
|---|---|---|
| Resource Group | `rg` | `centinela-rg-dev` |
| Virtual Network | `vnet` | `centinela-vnet-dev` |
| Subred de aplicación | `snet-app` | `centinela-snet-app-dev` |
| Subred de datos | `snet-data` | `centinela-snet-data-dev` |
| Network Security Group | `nsg` | `centinela-nsg-app-dev` |
| App Service Plan | `plan` | `centinela-plan-dev` |
| App Service (API) | `app` | `centinela-app-ingesta-dev` |
| Storage Account (Blob) | `st` (sin guiones internos, ver sección 4) | `centinelastdocsdev` |
| Storage Queue | `queue` | `centinela-queue-ingesta-dev` |
| Cosmos DB (semana 2) | `cosmos` | `centinela-cosmos-dev` |
| Key Vault | `kv` | `centinela-kv-dev` |
| Managed Identity | `id` | `centinela-id-api-dev` |
| Application Insights | `appi` | `centinela-appi-dev` |
| Log Analytics Workspace | `log` | `centinela-log-dev` |

> Esta tabla se amplía en semanas 2 y 3 conforme aparezcan nuevos tipos de recurso (Event Grid/Service Bus si se decide reemplazar la cola simple, servicios de IA, etc.).

---

## 4. Caso especial: nombres únicos globalmente

Algunos recursos de Azure requieren un nombre **único en todo Azure**, no solo dentro del Resource Group o la suscripción. Los más relevantes para este proyecto:

- **Storage Accounts**: nombre único global, solo minúsculas y números, sin guiones, entre 3 y 24 caracteres.
- **Key Vault**: nombre único global.
- **App Service**: el nombre de la app define su URL pública (`<nombre>.azurewebsites.net`), por lo que también debe ser único global.

**Solución adoptada:** para estos recursos, se agrega un sufijo corto y determinístico al final, generado a partir del proyecto y un identificador corto (por ejemplo, los primeros 6 caracteres del ID de suscripción, o un hash corto fijo acordado por el equipo), eliminando los guiones donde el recurso no los permite.

Ejemplo para Storage Account:
```
centinela + st + docs + dev + <sufijo-corto>
→ centinelastdocsdev7x2k
```

El sufijo se define **una sola vez** al inicio del proyecto y se declara como variable en el script de aprovisionamiento (nunca hardcodeado en más de un lugar), para que el script siga siendo idempotente y reproducible.

---

## 5. Variables del script de aprovisionamiento

Estas son las variables que Dani debe declarar al inicio del script (no repetir valores en el cuerpo):

```bash
PROYECTO="centinela"
AMBIENTE="dev"
REGION="eastus"          # confirmar tras informe de cuotas
SUFIJO_UNICO="<definir>" # ej. 6 caracteres alfanuméricos fijos para el equipo
```

---

## 6. Pendiente de confirmación

- [ ] Región definitiva (Dani, tras informe de cuotas)
- [ ] Sufijo único acordado por el equipo (cualquiera puede proponerlo, debe fijarse antes de la primera ejecución del script)
