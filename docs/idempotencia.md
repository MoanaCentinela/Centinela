# Estrategia de Idempotencia

## Objetivo

Evitar que una misma transacción sea procesada varias veces cuando un cliente reintenta una solicitud debido a problemas de red o tiempos de espera.

## Estrategia

Cada transacción debe incluir un identificador único (`transactionId`) generado por el cliente utilizando UUID v4.

Antes de almacenar la transacción, el sistema verifica si ese identificador ya existe.

### Si no existe

- Se almacena la transacción.
- Se responde HTTP 202 Accepted.

### Si ya existe

- No se vuelve a almacenar.
- Se responde HTTP 200 OK.
- Se informa al cliente que la transacción ya fue recibida previamente.

## Implementación actual

Durante la Semana 1 la verificación se realiza utilizando un repositorio en memoria (`MemoryTransactionRepository`).

## Implementación futura

Cuando Cosmos DB esté disponible, la validación se realizará consultando la base de datos utilizando el mismo `transactionId`, sin modificar la lógica del servicio gracias al uso del puerto `TransactionRepository`.