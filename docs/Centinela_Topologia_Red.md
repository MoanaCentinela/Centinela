# Centinela — Topología de Red

Esta guía describe la topología base aprovisionada por los scripts actuales y su diseño de seguridad.

---

## 1. Red virtual (VNet)

| Parámetro | Valor |
|---|---|
| Nombre | `centinela-vnet-dev` |
| Rango de direcciones | `10.0.0.0/16` (65.536 IPs — amplio margen para las 3 semanas) |
| Región | `chilecentral` (ver convención de nombres) |

---

## 2. Subredes

| Subred | Nombre | Rango (CIDR) | IPs utilizables | Componentes | Semana |
|---|---|---|---|---|---|
| Aplicación | `centinela-snet-app-dev` | `10.0.1.0/24` | ~251 | App Service (API de ingesta) vía VNet Integration | 1 |
| Datos | `centinela-snet-data-dev` | `10.0.2.0/24` | ~251 | Cosmos DB (Service Endpoint), Storage Account (Service Endpoint), SQL Database (VNet Rule) | 2 |
| Futuro / IA | `centinela-snet-future-dev` | `10.0.3.0/24` | ~251 | Servicios de IA, Service Bus si se reemplaza la cola simple, componentes de semana 3 | 3 |

---

## 3. Objetivo de diseño

La topología busca que la API de ingesta sea el único punto de entrada público y que el acceso a los recursos de datos quede restringido a la subred de aplicación.

---

## 4. Alineación con la implementación

La integración de App Service con VNet (VNet Integration) tiene un requisito de tamaño mínimo: **la subred debe ser al menos `/28`** (16 direcciones, de las cuales Azure reserva 5, dejando 11 utilizables). Ese mínimo es *insuficiente* para este proyecto porque:

- Cada instancia de escalado del App Service Plan consume una dirección IP de la subred.
- La semana 3 contempla escalado, y quedarse en `/28` limitaría a pocas instancias simultáneas.

Por eso se dimensiona la subred de aplicación en `/24` (251 IPs utilizables), muy por encima del mínimo, para no tener que rehacer la integración de red cuando el sistema escale.

Los nombres y rangos de red usados en esta guía coinciden con los valores definidos en [infra/scripts/variables.sh](../infra/scripts/variables.sh) y con el aprovisionamiento ejecutado por [infra/scripts/provision.sh](../infra/scripts/provision.sh).

---

## 5. Reglas de tráfico (deny-by-default)

Regla general: **todo el tráfico se deniega por defecto**; solo se permite explícitamente lo que una operación concreta del sistema requiere. Para lograr esto de manera efectiva, se asocia un Grupo de Seguridad de Red (NSG) a cada una de las subredes operativas.

### 5.1 NSG de la Subred de Aplicación (`centinela-nsg-app-dev`)

Este NSG protege la subred donde reside la API de ingesta (App Service).

#### Reglas de Entrada (Inbound Security Rules)

| Prioridad | Nombre de Regla | Origen | Puerto Origen | Destino | Puerto Destino | Protocolo | Acción | Justificación Operativa |
|---|---|---|---|---|---|---|---|---|
| 100 | `Allow-HTTPS-Inbound` | `Internet` | `*` | `VirtualNetwork` | `443` | `TCP` | **Allow** | Permite que la API de ingesta reciba transacciones de los clientes y comercios. Único punto de entrada público del sistema. |
| 65500 | `Deny-All-Inbound` | `*` | `*` | `*` | `*` | `*` | **Deny** | Denegación explícita por defecto para cualquier otro tráfico entrante. |

#### Reglas de Salida (Outbound Security Rules)

| Prioridad | Nombre de Regla | Origen | Puerto Origen | Destino | Puerto Destino | Protocolo | Acción | Justificación Operativa |
|---|---|---|---|---|---|---|---|---|
| 100 | `Allow-AAD-Outbound` | `*` | `*` | `AzureActiveDirectory` (Service Tag) | `443` | `TCP` | **Allow** | Requerido para que la API obtenga tokens de Microsoft Entra ID para la Managed Identity. |
| 110 | `Allow-Storage-Outbound` | `*` | `*` | `Storage` (Service Tag) | `443` | `TCP` | **Allow** | Permite que la API acceda a las colas y blobs del Storage Account. |
| 120 | `Allow-CosmosDB-Outbound` | `*` | `*` | `AzureCosmosDB` (Service Tag) | `443`, `10250-10255` | `TCP` | **Allow** | Requerido para conectarse de manera segura a la base de datos documental (semana 2). |
| 130 | `Allow-Monitor-Outbound` | `*` | `*` | `AzureMonitor` (Service Tag) | `443` | `TCP` | **Allow** | Permite enviar telemetría y logs a Application Insights / Log Analytics. |
| 140 | `Allow-SQL-Outbound` | `*` | `*` | `Sql` (Service Tag) | `1433` | `TCP` | **Allow** | Habilita la comunicación segura con el servidor Azure SQL Database para el almacenamiento de casos. |
| 65500 | `Deny-All-Outbound` | `*` | `*` | `*` | `*` | `*` | **Deny** | Denegación explícita por defecto. Bloquea cualquier otra conexión saliente no aprobada (evita exfiltración de datos). |

---

### 5.2 NSG de la Subred de Datos (`centinela-nsg-data-dev`)

Este NSG aísla por completo la capa de datos (Storage Account, Cosmos DB) de accesos no autorizados.

#### Reglas de Entrada (Inbound Security Rules)

| Prioridad | Nombre de Regla | Origen | Puerto Origen | Destino | Puerto Destino | Protocolo | Acción | Justificación Operativa |
|---|---|---|---|---|---|---|---|---|
| 100 | `Allow-App-Subnet-Inbound` | `10.0.1.0/24` (Subred App) | `*` | `10.0.2.0/24` (Subred Datos) | `443`, `10250-10255` | `TCP` | **Allow** | Permite que únicamente la API de ingesta pueda realizar consultas y escrituras en Cosmos DB y Storage. |
| 65500 | `Deny-All-Inbound` | `*` | `*` | `*` | `*` | `*` | **Deny** | **DENEGADO explícitamente.** Ningún origen distinto a la subred de aplicación puede alcanzar la capa de datos (incluyendo Internet). Cumple con el requerimiento no negociable del brief. |

#### Reglas de Salida (Outbound Security Rules)

| Prioridad | Nombre de Regla | Origen | Puerto Origen | Destino | Puerto Destino | Protocolo | Acción | Justificación Operativa |
|---|---|---|---|---|---|---|---|---|
| 65500 | `Deny-All-Outbound` | `*` | `*` | `*` | `*` | `*` | **Deny** | Los recursos en la subred de datos nunca inician tráfico saliente; solo responden a peticiones entrantes autorizadas. |

---

## 6. Mecanismo de aislamiento de la capa de datos

El brief pide usar **el mecanismo de restricción de acceso por subred que ofrece la plataforma sin costo adicional**. Esto corresponde a **Service Endpoints** (no Private Endpoints, que tienen costo adicional por hora + procesamiento de datos).

| Mecanismo | Costo | Cómo funciona | Cuándo se usaría el otro |
|---|---|---|---|
| **Service Endpoint** (elegido) | Gratis | Extiende la identidad de la subred hacia el servicio de Azure (Storage, Cosmos DB, SQL Database); el tráfico sigue viajando por la red pública de Azure (backbone), pero el recurso solo acepta conexiones desde las subredes autorizadas. | — |
| **Private Endpoint** (alternativa de pago) | Costo por hora + por GB procesado | Crea una interfaz de red privada dentro de la VNet con una IP privada propia para el recurso; el tráfico nunca sale a la red pública de Azure. Aísla también a nivel de DNS. | Si en semana 3 el presupuesto lo permite y se requiere aislamiento total (ni siquiera por el backbone de Azure), o si hay requisitos de cumplimiento más estrictos. |

**Diferencia clave para el equipo:** con Service Endpoints, los recursos (ej. Storage Account, SQL Server) siguen teniendo una IP pública, pero su firewall/reglas de VNet solo aceptan tráfico proveniente de las subredes marcadas como confiables. Con Private Endpoint, el recurso deja de tener IP pública alcanzable y pasa a vivir "dentro" de la VNet. Para este proyecto, con presupuesto de 21 días y <20 USD/semana, Service Endpoints cumple el requerimiento del brief sin costo.

---

## 7. Prueba de aislamiento (a ejecutar en la validación de cierre)

Pasos que Dani/Maribel deben ejecutar y documentar como evidencia:

1. Desde una máquina/red **fuera** de la VNet de Centinela (ej. desde la propia laptop, sin VPN), intentar acceder a la Storage Account por su URL pública (`https://<nombre>.blob.core.windows.net`).
2. Resultado esperado: **conexión rechazada / 403 Forbidden** — el firewall del Storage Account solo permite tráfico desde `centinela-snet-app-dev`.
3. Capturar el error (screenshot o log de consola) como evidencia para el entregable #14 (Prueba de aislamiento).

---

## 8. Diagrama de red (descripción para el diagrama visual)

```
Internet
   │
   │ HTTPS (443) — único punto de entrada
   ▼
┌─────────────────────────────────────────┐
│  VNet: centinela-vnet-dev (10.0.0.0/16) │
│                                          │
│  ┌────────────────────────────────┐     │
│  │ snet-app (10.0.1.0/24)         │     │
│  │  → App Service (API ingesta)   │     │
│  └───────────────┬────────────────┘     │
│                  │ Service Endpoint      │
│                  │ (permitido)           │
│                  ▼                       │
│  ┌────────────────────────────────┐     │
│  │ snet-data (10.0.2.0/24)        │     │
│  │  → Cosmos DB (semana 2)        │     │
│  │  → Storage Account (Blob)      │     │
│  │  → SQL Database (Casos)        │     │
│  │  🚫 Sin acceso desde Internet   │     │
│  └────────────────────────────────┘     │
│                                          │
│  ┌────────────────────────────────┐     │
│  │ snet-future (10.0.3.0/24)      │     │
│  │  → Semana 3 (IA, escalado)     │     │
│  └────────────────────────────────┘     │
└─────────────────────────────────────────┘
```

---

## 9. Pendiente de confirmación

- [ ] Validar con Dani que el App Service Plan elegido (nivel mínimo con VNet Integration) es compatible con Service Endpoints hacia Storage/Cosmos DB.
- [ ] Ejecutar y documentar la prueba de aislamiento (sección 7) antes de dar la semana por cerrada.
