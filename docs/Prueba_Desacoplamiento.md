# Evidencia de Prueba de Desacoplamiento (CEN-76)

**Objetivo:** Demostrar la resiliencia del sistema aislando la API de Ingesta de la disponibilidad del Motor de Scoring mediante una cola de mensajería.

## Pasos Ejecutados:
1. **Apagado del Consumidor:** Se detuvo intencionalmente la ejecución del Motor de Scoring (Azure Function) desde el portal de Azure.
   * *(Inserta aquí una captura de pantalla de la Function detenida en Azure)*
2. **Envío de Transacciones:** Se enviaron 3 peticiones de prueba a la API de Ingesta utilizando Postman.
3. **Validación de la API:** La API respondió correctamente con un código `200/202` a pesar de que el Motor estaba caído.
   * *(Inserta aquí una captura de pantalla de Postman mostrando el Status 200/202)*
4. **Validación de la Cola:** Los mensajes quedaron retenidos de forma segura en la capa de mensajería (Storage Queue).
   * *(Inserta aquí una captura de la cola en Azure mostrando los 3 mensajes esperando)*
5. **Restablecimiento:** Se volvió a iniciar el Motor de Scoring.
6. **Procesamiento Exitoso:** El motor consumió automáticamente los mensajes encolados y los procesó sin pérdida de datos.
   * *(Inserta aquí captura de los logs o de CosmosDB mostrando que la transacción se procesó finalmente)*

**Conclusión:** La prueba es exitosa. El sistema cumple con el requerimiento de alta disponibilidad en la ingesta.
