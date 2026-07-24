# Contrato de transacción

Este documento describe el contrato que usa la API de ingesta y el estado actual de la implementación en el repositorio.

## 1. Estructura actual del payload

El contrato está definido en [apps/api/src/shared/contracts/transaction.schema.ts](../apps/api/src/shared/contracts/transaction.schema.ts) y se exporta desde [apps/api/src/shared/contracts/index.ts](../apps/api/src/shared/contracts/index.ts).

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

## 2. Reglas aplicadas por el esquema

- `transactionId`, `accountId`, `currency` y `merchant.id` son obligatorios.
- `amount` debe ser numérico, mayor que cero y menor o igual a 1_000_000_000.
- `clientTimestamp` debe tener formato ISO 8601.
- `location.latitude` debe estar entre -90 y 90.
- `location.longitude` debe estar entre -180 y 180.
- El esquema es estricto, por lo que campos adicionales no están permitidos.

## 3. Reglas de negocio actuales

La validación adicional de tiempo se implementa en [apps/api/src/modules/validation/services/TransactionValidator.ts](../apps/api/src/modules/validation/services/TransactionValidator.ts):

- `clientTimestamp` no puede estar en el futuro.

## 4. Idempotencia

La API actual usa un repositorio en memoria para detectar duplicados por `transactionId` mediante [apps/api/src/modules/ingestion/repositories/MemoryTransactionRepository.ts](../apps/api/src/modules/ingestion/repositories/MemoryTransactionRepository.ts).

## 5. Alineación con la arquitectura

- El contrato vive en la capa compartida.
- El validador pertenece al módulo de validation.
- El servicio de ingestión orquesta el proceso.
- El repositorio expone el puerto [apps/api/src/shared/ports/TransactionRepository.ts](../apps/api/src/shared/ports/TransactionRepository.ts).
- La publicación de eventos a cola está documentada como un punto futuro en [apps/api/src/modules/ingestion/services/TransactionService.ts](../apps/api/src/modules/ingestion/services/TransactionService.ts).