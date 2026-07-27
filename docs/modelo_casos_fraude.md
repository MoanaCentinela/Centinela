# Modelo Relacional de Casos de Fraude

## ¿Qué es y cómo funciona?

A diferencia de Cosmos DB, los casos de fraude sí necesitan una base de datos relacional tradicional (SQL). ¿Por qué? Porque un caso de fraude pasa por manos de analistas, cambia de estado (Abierto -> En Revisión -> Cerrado) y necesitas reglas estrictas para auditar quién tocó qué.

## Diseño de Tablas

| Entidad | Campos Principales | Relaciones | Propósito |
| :--- | :--- | :--- | :--- |
| **Caso** | `id` (PK)<br>`transactionId` (Unique)<br>`score`<br>`estadoId` (FK)<br>`fechaApertura` | Relacionado con Estado y la transacción original. | Almacena la cabecera del caso generado por el motor. |
| **Estado** | `id` (PK)<br>`nombre` | Catálogo fijo. | Valores posibles: ABIERTO, ASIGNADO, RESUELTO. |
| **Asignación** | `id` (PK)<br>`casoId` (FK)<br>`analistaId`<br>`fechaAsignacion` | Relacionado con Caso. | Registra qué analista humano está investigando el caso. |
| **Resolución** | `id` (PK)<br>`casoId` (FK)<br>`analistaId`<br>`decision`<br>`fecha`<br>`observaciones` | Relacionado con Caso. | Guarda el veredicto (ej. "Fraude Confirmado" o "Falso Positivo"). |
| **Auditoría** | `id` (PK)<br>`casoId` (FK)<br>`estadoAnteriorId`<br>`estadoNuevoId`<br>`usuarioId`<br>`fechaCambio` | Relacionado con Caso. | Registro inmutable exigido. Nadie puede borrar datos de aquí. |
