## Estrategia de Respaldo — Almacén de Casos de Fraude

**Código:** CEN-27  
**Actividad:** Documentar Estrategia de Respaldo

## 1. Alcance del documento

Este documento define la estrategia de respaldo del almacén relacional de casos de fraude (base de datos de gestión de casos, estados, asignaciones, resoluciones y auditoría).

No cubre el almacén de transacciones (no relacional), cuya política es de expiración de datos (TTL), no de respaldo, dado que su naturaleza y volumen son distintos.

El almacén de casos contiene información de bajo volumen pero alta criticidad: es el registro de qué transacciones fueron marcadas como fraude, quién las resolvió y cómo. Su pérdida no se puede compensar reprocesando transacciones, porque el trabajo de análisis humano no es reconstruible automáticamente.

## 2. Periodicidad de los respaldos

**Servicio:** Azure SQL Database (tier gratuito/Basic)

Azure SQL Database gestiona los respaldos automáticamente como parte del servicio administrado; no requiere configuración manual de periodicidad.

La plataforma toma:

- **Copia de respaldo completa (full):** aproximadamente una vez por semana.
- **Copia diferencial:** cada 12 horas aproximadamente.
- **Copia de registro de transacciones (log):** cada 5 a 10 minutos.

### Justificación

No se implementa un mecanismo de respaldo adicional porque duplicaría un servicio que la plataforma ya ofrece sin costo dentro del tier utilizado, y consumiría crédito sin necesidad.

La decisión relevante de esta sección no es “con qué frecuencia respaldar”, sino “qué punto de restauración dentro de esa ventana automática satisface la tolerancia de pérdida del negocio”, lo cual se resuelve en la sección 4 (RPO).

Si en el momento de la implementación el tier gratuito no ofrece este mecanismo con las características aquí descritas, se documentará un mecanismo alterno (por ejemplo, exportación programada hacia Azure Blob Storage) justificando la frecuencia elegida en función del volumen bajo de escritura propio de este almacén.

## 3. Retención

**Periodo de retención:** 7 días (valor por defecto del tier utilizado)

El tier gratuito/Basic de Azure SQL Database retiene los puntos de restauración por 7 días. Tiers superiores permiten extender la retención hasta 35 días, pero implican costo adicional no contemplado en el presupuesto de esta semana.

### Justificación

Es importante distinguir dos conceptos que cumplen funciones distintas en este sistema y que no deben confundirse:

- **El respaldo (backup)** existe para recuperación operativa ante fallas técnicas o errores humanos recientes: un borrado accidental, una migración fallida, una corrupción de datos.
- **La trazabilidad de largo plazo** la garantiza la tabla de Auditoría del propio modelo de datos, que registra de forma inmutable cada cambio de estado (qué cambió, quién y cuándo). Esta tabla vive dentro de la base de datos operativa y no depende del ciclo de vida del backup.

Por lo tanto, 7 días de retención son suficientes: cubren la ventana realista en la que un incidente operativo sería detectado y requeriría restauración, sin necesidad de pagar por retención extendida que en este sistema no cumple un propósito adicional (la auditoría de negocio no depende del backup).

## 4. Pérdida máxima tolerable de datos (RPO)

**RPO objetivo:** 5 a 10 minutos

El RPO (Recovery Point Objective) queda determinado por la frecuencia de respaldo del log de transacciones de Azure SQL Database, que ocurre cada 5 a 10 minutos. Esto significa que, ante una falla, en el peor caso se perderían los cambios realizados en esa ventana de tiempo.

### Justificación

Este nivel de RPO es aceptable para este almacén específico por las siguientes razones:

- El volumen de escritura es bajo comparado con el almacén de transacciones: los eventos que se pierden en una ventana de 5 a 10 minutos serían, como máximo, algunas altas de casos, cambios de estado o asignaciones; no transacciones financieras crudas, que residen en el otro almacén y no están sujetas a este RPO.
- Los datos perdidos son operativamente recuperables: un caso de fraude que no llegó a persistirse por la falla puede regenerarse porque la transacción origen y su score siguen existiendo en el almacén de transacciones; no se pierde evidencia financiera, sino en el peor caso el estado de gestión de un caso puntual.
- Endurecer el RPO exigiría un tier de servicio superior con costo adicional, lo cual no está justificado frente al riesgo real que se mitiga para un componente de bajo volumen.

## 5. Resumen

| Parámetro | Valor | Justificación breve |
|---|---|---|
| Mecanismo | Backup automático gestionado (Azure SQL) | Sin configuración manual; incluido en el tier |
| Periodicidad | Full semanal / diferencial ~12 h / log ~5–10 min | Gestionado por la plataforma |
| Retención | 7 días | Cubre ventana operativa de detección de incidentes |
| RPO | 5 a 10 minutos | Bajo volumen de escritura; datos recuperables vía almacén de transacciones |
| Costo adicional | Ninguno | Se mantiene dentro del tier gratuito/Basic |