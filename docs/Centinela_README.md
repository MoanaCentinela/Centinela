# Centinela — README de Despliegue

> Este documento debe permitir a un tercero clonar el repositorio y levantar el sistema completo, sin conocimiento previo no documentado aquí. Si en algún paso hace falta "preguntarle a alguien del equipo", ese paso está incompleto.

---

## 1. Requisitos previos

- [ ] Cuenta de Azure con una suscripción activa (ver sección 2 sobre límite de gasto)
- [ ] [Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli) instalado (versión mínima: `<completar>`)
- [ ] Sesión iniciada: `az login`
- [ ] Suscripción correcta seleccionada: `az account set --subscription "<nombre-o-id-suscripción>"`
- [ ] Permisos de **Administrador** (rol definido en la matriz RBAC) sobre la suscripción, para poder ejecutar el script de aprovisionamiento

---

## 2. Verificación previa: límite de gasto y cuotas

Antes de ejecutar cualquier script, verificar:

1. Que el **límite de gasto** de la suscripción esté activo (Dani lo documenta en el informe de cuotas).
2. Que la región elegida (`<región — ver Centinela_ADR.md, ADR-002>`) tenga cuota disponible para todos los servicios necesarios (Storage, App Service Plan, Cosmos DB, Document Intelligence).

> Referencia: `Centinela_Informe_Cuotas.md` (documento de Dani).

---

## 3. Variables de entorno / parámetros del script

Todas las variables se declaran en un único archivo al inicio del script de aprovisionamiento — **no hay valores hardcodeados en el cuerpo**.

```bash
PROYECTO="centinela"
AMBIENTE="dev"
REGION="<confirmar con Dani>"
SUFIJO_UNICO="<definido por el equipo, una sola vez>"
```

Ver `Centinela_Convencion_Nombres.md` para el detalle completo de cómo se construyen los nombres de cada recurso.

---

## 4. Pasos de despliegue

### 4.1 Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd <nombre-del-repositorio>
```

### 4.2 Ejecutar el script de aprovisionamiento

```bash
cd infra/
./provision.sh
```

Este script (parametrizado e idempotente) crea, en orden:

1. Resource Group
2. Virtual Network + subredes (`snet-app`, `snet-data`, `snet-future`) — ver `Centinela_Topologia_Red.md`
3. Network Security Groups con las reglas deny-by-default
4. Storage Account (Blob + Queue) con Service Endpoints habilitados desde `snet-app`
5. App Service Plan + App Service (API de ingesta), con VNet Integration hacia `snet-app`
6. Managed Identity para el rol Servicio, con las asignaciones RBAC correspondientes — ver `Centinela_RBAC_Matriz.md`
7. Application Insights / Log Analytics

Al finalizar, el script imprime un resumen con los nombres y endpoints de los recursos creados.

> **Nota de idempotencia:** una segunda ejecución del script no debe producir efectos adversos. Si algún comando específico no es idempotente, debe estar documentado en `infra/README.md` (el equipo de Dani documenta esto ahí).

### 4.3 Configurar la aplicación

La configuración de la API vive en **Application Settings** del App Service (externalizada del código), no en archivos de configuración versionados. El script del paso 4.2 ya las configura automáticamente a partir de los recursos creados; no se requiere edición manual.

Si se necesita revisar o modificar manualmente:

```bash
az webapp config appsettings list --name <nombre-app-service> --resource-group <nombre-rg>
```

### 4.4 Verificar el despliegue

```bash
curl https://<nombre-app-service>.azurewebsites.net/health
```

Respuesta esperada: `200 OK`.

---

## 5. Prueba funcional mínima

Una vez desplegado, verificar el flujo completo de ingesta:

### 5.1 Enviar una transacción válida

```bash
curl -X POST https://<nombre-app-service>.azurewebsites.net/transacciones \
  -H "Content-Type: application/json" \
  -d '{
    "cuenta_origen": "<ejemplo>",
    "monto": 15000,
    "timestamp": "<generado por el servidor, no enviar>",
    "ubicacion": {"lat": 6.25, "lon": -75.56},
    "comercio": "<ejemplo>",
    "id_transaccion": "<uuid-ejemplo>"
  }'
```

Respuesta esperada: `201 Created` (o el código de estado definido en `Centinela_Tabla_Codigos_Estado.md`), con acuse de recibo.

### 5.2 Enviar una transacción inválida

```bash
curl -X POST https://<nombre-app-service>.azurewebsites.net/transacciones \
  -H "Content-Type: application/json" \
  -d '{"monto": -100}'
```

Respuesta esperada: `400 Bad Request`, sin exponer detalles internos del sistema (stack traces, nombres de recursos, etc.).

### 5.3 Verificar el aislamiento de la capa de datos

Desde una red **fuera** de la VNet (ej. la laptop personal, sin VPN):

```bash
curl https://<nombre-storage-account>.blob.core.windows.net/<contenedor>
```

Resultado esperado: conexión rechazada (`403 Forbidden` o timeout) — ver `Centinela_Topologia_Red.md`, sección 6.

---

## 6. Apagado de recursos (fin de jornada)

Para evitar consumo de crédito fuera de horario de trabajo:

```bash
cd infra/
./shutdown.sh
```

Este script detiene o elimina los recursos que consumen crédito activamente (ej. detener el App Service Plan si es de nivel con costo por tiempo de ejecución). Debe ejecutarse al cierre de cada jornada.

---

## 7. Estructura del repositorio

```
├── infra/              # Scripts de aprovisionamiento y apagado (Dani)
│   ├── provision.sh
│   ├── shutdown.sh
│   └── README.md       # Notas técnicas específicas de los scripts
├── apps/
│   └── api/             # API de ingesta (Maribel)
├── packages/
│   └── database/        # Modelo de datos conceptual (Vale) — sin código de despliegue esta semana
├── docs/
│   ├── Centinela_ADR.md
│   ├── Centinela_Convencion_Nombres.md
│   ├── Centinela_Topologia_Red.md
│   ├── Centinela_RBAC_Matriz.md
│   └── Centinela_Clasificacion_Componentes.md
└── README.md            # Este documento
```

---

## 8. Validación de cierre completa

Antes de dar la semana por concluida, el equipo ejecuta en orden (sección 4 del brief):

1. Eliminar el grupo de recursos completo (`az group delete`)
2. Ejecutar `provision.sh` sobre la suscripción vacía
3. Completar la configuración siguiendo **exclusivamente este README**
4. Repetir los pasos 5.1 a 5.3 de este documento
5. Cargar un documento de prueba y verificar su llegada al contenedor
6. Escribir y leer un mensaje de prueba en la cola
7. Consultar y registrar el crédito consumido
8. Ejecutar `shutdown.sh`

> Cualquier paso de esta lista que requiera conocimiento no escrito en este README indica que el README está incompleto — se corrige antes de cerrar la semana.

---

## 9. Pendiente de completar (a medida que Dani/Maribel avancen)

- [ ] Nombre real del Resource Group, App Service, Storage Account (una vez el script defina el sufijo único)
- [ ] Versión mínima de Azure CLI requerida
- [ ] Contenido real de `infra/README.md` con notas de idempotencia
- [ ] Ejemplo de payload de transacción alineado al contrato final (Vale/Maribel)
