# Códigos de estado HTTP - API de Ingesta

## POST /transactions

| Código | Escenario | Descripción |
|---------|-----------|-------------|
| 202 Accepted | Transacción válida | La transacción fue aceptada y almacenada correctamente. |
| 200 OK | Transacción duplicada | La transacción ya había sido recibida anteriormente (idempotencia). |
| 400 Bad Request | Error de validación | El contrato recibido contiene errores y no se procesa. |
| 500 Internal Server Error | Error interno | Error inesperado del servidor. |