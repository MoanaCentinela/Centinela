# ADR 001: Contrato de Transacción y Modelo Conceptual de Datos

**Estado:** Aceptado
**Proyecto:** Centinela - Célula de Prevención de Fraude
**Responsables:** Vale (Contrato y Modelo) y Maribel (Ingesta API)

## 1. Contexto
Para la ingesta inicial de transacciones en la Semana 1 y el posterior análisis por parte del motor de *scoring* (Semana 2), es necesario definir una estructura de datos estándar (contrato) que atraviese todo el sistema. Esta estructura debe permitir responder a las reglas de negocio (velocidad, monto atípico, geo-imposible, etc.) y asegurar la integridad financiera y técnica de la plataforma.

## 2. Decisiones sobre el Contrato de la Transacción

### 2.1 Estructura del Payload (JSON)
Se define el siguiente esquema estándar para la recepción de transacciones vía API:

```json
{
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
}
```

### 2.2 Justificación de Tipos de Datos y Reglas

*   **Monto (`amount`) y Moneda:** 
    *   **Decisión:** El monto se enviará siempre como un número **Entero (Integer)** representando la unidad monetaria más pequeña (ej. centavos). 
    *   **Justificación:** El uso de punto flotante (`float` o `double`) genera problemas de precisión y redondeo en el procesamiento de muchos lenguajes de programación. Para evitar discrepancias financieras, 250.00 USD se envían como `25000`.
*   **Marca de tiempo (`clientTimestamp` vs `serverTimestamp`):**
    *   **Decisión:** Todas las fechas y horas operarán estrictamente en formato **UTC** (ISO 8601). El cliente envía su marca de tiempo (`clientTimestamp`), pero el sistema no confiará en ella para el análisis.
    *   **Justificación:** Un actor malicioso puede manipular el reloj de su dispositivo para burlar las reglas de velocidad. La API de ingesta será responsable de inyectar un campo `serverTimestamp` en el momento exacto de la recepción de la petición.
*   **Ubicación (`location`):**
    *   **Decisión:** Se utilizará un objeto anidado con `latitude` y `longitude` en formato numérico decimal.
    *   **Justificación:** Es el formato estándar requerido para el cálculo de distancias mediante fórmulas geoespaciales (necesario para la regla de "Geo-imposible" de la Semana 2).
*   **Estrategia de Idempotencia (`transactionId`):**
    *   **Decisión:** El cliente es responsable de generar un identificador único (UUID v4) para cada intento de transacción. 
    *   **Justificación (Comportamiento ante duplicados):** Si el sistema recibe una solicitud con un `transactionId` que ya existe en la base de datos, la API no persistirá el duplicado. En su lugar, retornará un código de estado exitoso (HTTP 200 OK) al cliente, confirmando que la transacción original ya fue recibida, evitando así cargos dobles por errores de red.

---

## 3. Modelo de Datos Conceptual (Preparación para Cosmos DB)

Aunque la base de datos documental (Cosmos DB) se aprovisionará en la Semana 2, la persistencia de la Semana 1 debe prever su estructura. 

El documento que se persistirá en la base de datos no será exactamente el mismo que envía el cliente; la API lo enriquecerá con metadatos del sistema.

### Estructura Conceptual del Documento Almacenado:

1.  **Datos Originales:** Se conservará la estructura íntegra enviada en el Payload inicial (campos de la sección 2.1).
2.  **Campos de Control del Sistema (Inyectados por la API):**
    *   `serverTimestamp`: (DateTime UTC) Hora oficial de recepción en el servidor.
    *   `status`: (String) Estado actual del ciclo de vida de la transacción. Valor inicial: `"RECEIVED"`.
    *   `_partitionKey`: (String) Se define tentativamente `accountId` como la clave de partición lógica, garantizando que todas las transacciones de una misma cuenta se almacenen juntas para optimizar las consultas del motor de *scoring*.