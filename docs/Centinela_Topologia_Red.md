# Centinela — Topología de Red

**Semana:** 1
**Estado:** Propuesta inicial — dimensionado para escalar en semanas 2 y 3

---

## 1. Requerimiento no negociable

> Los almacenes de datos no deben ser alcanzables desde internet. Únicamente la subred de aplicación puede acceder a ellos.

Toda la topología se diseña alrededor de esta restricción, aunque los almacenes relacionales/documentales (Cosmos DB) se desplieguen recién en la semana 2 — la red que los va a contener se define **ahora**, porque corregir el aislamiento después de tener datos persistidos es mucho más costoso que diseñarlo bien desde el inicio.

---

## 2. Red virtual (VNet)

| Parámetro | Valor |
|---|---|
| Nombre | `centinela-vnet-dev` |
| Rango de direcciones | `10.0.0.0/16` (65.536 IPs — amplio margen para las 3 semanas) |
| Región | Misma que el resto de recursos (ver convención de nombres) |

Se usa un rango `/16` completo aunque hoy solo se necesiten dos subredes, porque:
1. Cuesta cero usar un rango más grande.
2. Evita tener que rediseñar la VNet cuando aparezcan las subredes de semana 2/3 (Cosmos DB con Private Endpoint, servicios de IA, posible Service Bus).

---

## 3. Subredes

| Subred | Nombre | Rango (CIDR) | IPs utilizables | Componentes | Semana |
|---|---|---|---|---|---|
| Aplicación | `centinela-snet-app-dev` | `10.0.1.0/24` | ~251 | App Service (API de ingesta) vía VNet Integration | 1 |
| Datos | `centinela-snet-data-dev` | `10.0.2.0/24` | ~251 | Cosmos DB (Private Endpoint), Storage Account (Private Endpoint) | 2 |
| Futuro / IA | `centinela-snet-future-dev` | `10.0.3.0/24` | ~251 | Servicios de IA, Service Bus si se reemplaza la cola simple, componentes de semana 3 | 3 |

### Sobre el tamaño mínimo de la subred de aplicación

La integración de App Service con VNet (VNet Integration) tiene un requisito de tamaño mínimo: **la subred debe ser al menos `/28`** (16 direcciones, de las cuales Azure reserva 5, dejando 11 utilizables). Ese mínimo es *insuficiente* para este proyecto porque:

- Cada instancia de escalado del App Service Plan consume una dirección IP de la subred.
- La semana 3 contempla escalado, y quedarse en `/28` limitaría a pocas instancias simultáneas.

Por eso se dimensiona la subred de aplicación en `/24` (251 IPs utilizables), muy por encima del mínimo, para no tener que rehacer la integración de red cuando el sistema escale.

---

## 4. Reglas de tráfico (deny-by-default)

Regla general: **todo el tráfico se deniega por defecto**; solo se permite explícitamente lo que una operación concreta del sistema requiere. No existe ninguna regla que permita tráfico desde cualquier origen (`0.0.0.0/0` / `*` / `Internet` como origen amplio).

| # | Origen | Destino | Puerto | Protocolo | Justificación operativa |
|---|---|---|---|---|---|
| 1 | Internet | `centinela-snet-app-dev` (App Service) | 443 | TCP/HTTPS | Permite que la API de ingesta reciba transacciones de los clientes/comercios. Único punto de entrada público del sistema. |
| 2 | `centinela-snet-app-dev` | `centinela-snet-data-dev` | 443 | TCP/HTTPS | La API necesita persistir la transacción cruda en Cosmos DB / Storage (semana 2). |
| 3 | `centinela-snet-app-dev` | Storage Queue (endpoint de servicio) | 443 | TCP/HTTPS | La API publica en la cola de ingesta para absorber ráfagas. |
| 4 | `centinela-snet-app-dev` | Storage Account — Blob (endpoint de servicio) | 443 | TCP/HTTPS | Carga de documentos de verificación de identidad por parte de los analistas, vía la API. |
| 5 | Cualquier origen | `centinela-snet-data-dev` | * | * | **DENEGADO explícitamente.** Ningún origen distinto a la subred de aplicación puede alcanzar la capa de datos. Esta es la regla que se demuestra en la prueba de aislamiento. |
| 6 | Internet | `centinela-snet-data-dev` | * | * | **DENEGADO explícitamente.** Redundante con la regla 5, pero se deja explícita porque es el requerimiento no negociable del brief. |

> Las reglas 5 y 6 no son "ausencia de regla" — se documentan como reglas de denegación explícita dentro del NSG, para que quede evidencia de la decisión y no de un olvido.

---

## 5. Mecanismo de aislamiento de la capa de datos

El brief pide usar **el mecanismo de restricción de acceso por subred que ofrece la plataforma sin costo adicional**. Esto corresponde a **Service Endpoints** (no Private Endpoints, que tienen costo adicional por hora + procesamiento de datos).

| Mecanismo | Costo | Cómo funciona | Cuándo se usaría el otro |
|---|---|---|---|
| **Service Endpoint** (elegido) | Gratis | Extiende la identidad de la subred hacia el servicio de Azure (Storage, Cosmos DB); el tráfico sigue viajando por la red pública de Azure (backbone), pero el recurso solo acepta conexiones desde las subredes autorizadas. | — |
| **Private Endpoint** (alternativa de pago) | Costo por hora + por GB procesado | Crea una interfaz de red privada dentro de la VNet con una IP privada propia para el recurso; el tráfico nunca sale a la red pública de Azure. Aísla también a nivel de DNS. | Si en semana 3 el presupuesto lo permite y se requiere aislamiento total (ni siquiera por el backbone de Azure), o si hay requisitos de cumplimiento más estrictos. |

**Diferencia clave para el equipo:** con Service Endpoints, el recurso (ej. Storage Account) sigue teniendo una IP pública, pero su firewall solo acepta tráfico proveniente de las subredes marcadas como confiables. Con Private Endpoint, el recurso deja de tener IP pública alcanzable y pasa a vivir "dentro" de la VNet. Para este proyecto, con presupuesto de 21 días y <20 USD/semana, Service Endpoints cumple el requerimiento del brief sin costo.

---

## 6. Prueba de aislamiento (a ejecutar en la validación de cierre)

Pasos que Dani/Maribel deben ejecutar y documentar como evidencia:

1. Desde una máquina/red **fuera** de la VNet de Centinela (ej. desde la propia laptop, sin VPN), intentar acceder a la Storage Account por su URL pública (`https://<nombre>.blob.core.windows.net`).
2. Resultado esperado: **conexión rechazada / 403 Forbidden** — el firewall del Storage Account solo permite tráfico desde `centinela-snet-app-dev`.
3. Capturar el error (screenshot o log de consola) como evidencia para el entregable #14 (Prueba de aislamiento).

---

## 7. Diagrama de red (descripción para el diagrama visual)

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

## 8. Pendiente de confirmación

- [ ] Validar con Dani que el App Service Plan elegido (nivel mínimo con VNet Integration) es compatible con Service Endpoints hacia Storage/Cosmos DB.
- [ ] Ejecutar y documentar la prueba de aislamiento (sección 6) antes de dar la semana por cerrada.
