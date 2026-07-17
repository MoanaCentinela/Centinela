# Centinela — Matriz de Roles y Permisos (RBAC)

**Semana:** 1
**Estado:** Propuesta inicial — a validar con pruebas de acceso negativas

---

## 1. Principio rector

Todos los permisos se derivan de una pregunta simple: **¿qué función de negocio necesita este rol?** Si un permiso no tiene una operación concreta del sistema que lo justifique, no se otorga (principio de menor privilegio).

Se distingue explícitamente entre dos planos:

- **Plano de control**: administrar el recurso en sí (crearlo, borrarlo, cambiar su configuración, escalarlo).
- **Plano de datos**: operar sobre el contenido del recurso (leer/escribir un documento en Storage, leer/escribir un ítem en Cosmos DB, leer un mensaje de la cola).

Esta distinción importa porque **muchos roles integrados de Azure combinan ambos planos sin dejarlo claro**. Por ejemplo, el rol integrado "Storage Account Contributor" da permisos de plano de control (puede regenerar las claves de acceso de la cuenta, lo cual indirectamente da acceso total al plano de datos) pero no dice explícitamente "acceso a los datos". Por eso, antes de asignar un rol integrado, se revisan sus `actions` y `dataActions` en la definición JSON del rol, no solo su nombre.

---

## 2. Los 4 roles

| Rol | Función de negocio | Plano de control | Plano de datos |
|---|---|---|---|
| **Analista de fraude** | Investigar casos, revisar transacciones y documentos escalados | Ninguno | Lectura de transacciones y alertas; lectura/escritura de documentos de verificación de identidad (vía acceso temporal delegado) |
| **Administrador** | Gestionar la infraestructura del proyecto | Completo sobre el Resource Group | Ninguno directo (no necesita leer transacciones para administrar infraestructura) |
| **Servicio** (identidad de la aplicación) | La API de ingesta necesita persistir datos y publicar en la cola | Ninguno | Escritura de transacciones crudas; escritura de blobs (documentos); envío de mensajes a la cola |
| **Auditor de solo lectura** | Verificar cumplimiento sin capacidad de alterar nada | Ninguno (ni siquiera lectura de configuración si no es necesaria para la auditoría) | Solo lectura de transacciones, alertas y logs |

---

## 3. Matriz detallada de permisos

| Rol | Permiso | Plano | Recurso | Operación del sistema que lo justifica |
|---|---|---|---|---|
| Analista | Leer transacciones | Datos | Cosmos DB / Storage | Investigar un caso escalado (semana 2) |
| Analista | Generar SAS token de lectura/escritura temporal | Datos | Storage (Blob) | Cargar documento de verificación de identidad al escalar un caso |
| Analista | ~~Modificar configuración de infraestructura~~ | Control | — | **No aplica — prueba negativa #1** |
| Administrador | Crear/modificar/eliminar recursos | Control | Resource Group completo | Aprovisionar y mantener la infraestructura durante las 3 semanas |
| Administrador | Asignar roles RBAC | Control | Resource Group | Gestionar el acceso del equipo |
| Auditor | Leer transacciones y alertas | Datos | Cosmos DB / Storage | Verificar cumplimiento y trazabilidad |
| Auditor | Leer logs | Datos | Application Insights / Log Analytics | Revisar comportamiento del sistema sin alterar nada |
| Auditor | ~~Modificar cualquier recurso~~ | Control/Datos | — | **No aplica — prueba negativa #2** |
| Servicio | Escribir transacción cruda | Datos | Cosmos DB / Storage | Persistir tras validar el contrato (paso 3 de la API de ingesta) |
| Servicio | Escribir blob | Datos | Storage (Blob) | Guardar documento subido por un analista |
| Servicio | Enviar mensaje a la cola | Datos | Storage Queue | Publicar evento tras persistir (preparación para semana 2) |
| Servicio | ~~Crear un recurso nuevo~~ | Control | — | **No aplica — prueba negativa #3** |

> Cualquier permiso de esta tabla que, al revisarlo, no tenga una operación asociada, se retira. Esta tabla se revisa en cada sprint review.

---

## 4. Rol Servicio: identidad gestionada

El rol Servicio (la API de ingesta) se autentica mediante una **identidad administrada asignada por el sistema (System-Assigned Managed Identity)**, vinculada directamente al App Service. Esto significa:

- No hay usuario, contraseña, connection string ni clave de API almacenada en el código ni en la configuración.
- Azure gestiona la rotación de credenciales de forma transparente.
- Los permisos de esta identidad se otorgan vía RBAC directamente sobre los recursos (Storage, Cosmos DB, Queue), nunca vía claves compartidas.

Cada permiso otorgado a esta identidad debe poder señalarse contra una fila de la tabla de la sección 3. Si en algún momento se necesita un permiso nuevo, se agrega una fila con su justificación antes de otorgarlo — no al revés.

---

## 5. Pruebas de acceso negativas (mínimo 3, requeridas por el brief)

| # | Rol | Acción intentada | Resultado esperado | Cómo se prueba |
|---|---|---|---|---|
| 1 | Analista | Modificar la configuración de un recurso de infraestructura (ej. cambiar el nivel del App Service Plan) | Denegado (403 / Forbidden) | Autenticarse con una identidad que tenga solo el rol Analista asignado e intentar la operación vía CLI o portal |
| 2 | Auditor | Modificar cualquier recurso (ej. intentar escribir un blob o cambiar una regla de red) | Denegado (403 / Forbidden) | Autenticarse con el rol Auditor e intentar una escritura |
| 3 | Servicio | Crear un recurso nuevo (ej. intentar crear una nueva Storage Account) | Denegado (403 / Forbidden) | Desde la identidad administrada de la API, intentar una operación de plano de control |

**Registro de resultados:** cada prueba debe documentarse con: fecha, quién la ejecutó, comando/acción exacta usada, resultado obtenido (idealmente con captura de pantalla o log del error de autorización). Esto alimenta el entregable #10 (Bitácora de pruebas negativas).

---

## 6. Autenticación vs. Autorización — aplicado a Centinela

Estos dos conceptos se confunden fácil, así que van con ejemplo concreto de cada uno dentro del sistema:

### Autenticación (¿quién eres?)

Verifica la identidad de quien hace la solicitud, sin decidir todavía qué puede hacer.

**Ejemplo en Centinela:** cuando la API de ingesta necesita escribir un blob en el Storage Account, la identidad administrada del App Service presenta un token emitido por Azure Active Directory (Microsoft Entra ID) a Storage. Ese paso — Storage confirmando "sí, esta solicitud viene genuinamente de la identidad administrada de `centinela-app-ingesta-dev`, y no de un impostor" — es autenticación. Storage aún no ha decidido si esa identidad puede escribir; solo ha confirmado quién la está llamando.

### Autorización (¿qué puedes hacer, ya que sé quién eres?)

Una vez confirmada la identidad, el sistema verifica si esa identidad tiene el permiso concreto para la acción solicitada.

**Ejemplo en Centinela:** después de autenticar a la identidad administrada, Storage revisa las asignaciones de rol RBAC: ¿tiene esta identidad el rol "Storage Blob Data Contributor" (o equivalente) sobre este contenedor específico? Si sí, permite la escritura del documento. Si un Analista de fraude (autenticado correctamente, identidad válida) intentara la misma operación de escritura de infraestructura, la autenticación pasaría igual (Azure sabe que es un Analista real) pero la autorización fallaría, porque el rol Analista no tiene ese permiso en la matriz de la sección 3.

**En una frase:** autenticación confirma la identidad; autorización decide qué le está permitido hacer a esa identidad ya confirmada.

---

## 7. Pendiente de confirmación

- [ ] Ejecutar las 3 pruebas de acceso negativas y adjuntar evidencia (sección 5)
- [ ] Revisar los roles integrados de Azure que se vayan a usar (ej. "Storage Blob Data Contributor") contra sus `actions`/`dataActions` reales antes de asignarlos
- [ ] Confirmar con Dani que las asignaciones de rol se crean desde el script de aprovisionamiento (requerimiento del brief, sección 2.6)
