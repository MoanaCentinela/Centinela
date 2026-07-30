# Auditoría de Secretos en Código y Repositorio

**Código:** CEN-37  
**Actividad:** Auditoría completada — remediación pendiente de aplicar

---

## 1. Alcance y objetivo

Verificar que ninguna credencial (contraseñas, connection strings, claves de acceso, tokens) exista:

1. En el código fuente actual (CEN-45).
2. En variables de entorno configuradas manualmente (CEN-46).
3. En el historial de control de versiones, incluyendo commits anteriores ya modificados o eliminados (CEN-47).

La auditoría cubre la totalidad de la rama `develop` (27 commits) y el árbol de trabajo actual. No se auditó `main` por instrucción explícita del equipo; se recomienda repetir esta misma auditoría contra `main` antes del cierre de la semana, dado que ambas ramas convergen eventualmente vía pull request.

## 2. Metodología y herramientas

Se aplicaron dos capas de revisión, porque las herramientas automáticas de patrones genéricos no cubren todos los casos (por ejemplo, contraseñas literales pasadas como argumento de CLI sin un patrón `clave=valor` reconocible).

### 2.1 Escaneo automatizado — Gitleaks v8.21.2

**Historial completo de commits:**
```bash
gitleaks detect --source . --log-opts="--all" -v \
  --report-format json --report-path gitleaks-report.json
```
Resultado: 18 commits escaneados, **sin hallazgos**.

**Árbol de trabajo actual:**
```bash
gitleaks dir . -v --report-format json --report-path gitleaks-dir-report.json
```
Resultado: **sin hallazgos**.

### 2.2 Revisión manual dirigida

Gitleaks usa reglas basadas en patrones conocidos (formatos de claves de AWS, tokens de Slack, JWT, etc.) y en pares `clave=valor`. No detecta de forma confiable literales de contraseña pasados como argumento posicional de una CLI (p. ej. `--admin-password "valor"` en una línea separada del flag). Por eso se complementó con:

```bash
# Patrones de secretos en el árbol de trabajo actual
grep -rniE "(password|pwd|secret|apikey|api_key|access[_-]?key|connectionstring|conn[_-]?str|AccountKey=|SharedAccessSignature|sig=)" \
  --include="*.ts" --include="*.js" --include="*.sh" --include="*.json" \
  --include="*.md" --include="*.yaml" --include="*.yml" .

# Patrones de tokens conocidos (AWS, Slack, claves privadas PEM)
grep -rniE "(sk-|AKIA|Bearer [A-Za-z0-9_\-\.]{20,}|xox[baprs]-|-----BEGIN)" .

# Búsqueda de archivos .env alguna vez trackeados en cualquier commit del historial
git log --all --diff-filter=A --name-only | grep -iE "\.env$|\.env\.|secrets\.|credentials"

# Localización del commit que introdujo una cadena específica
git log --all --oneline -S '<cadena sospechosa>' -- <archivo>
```

Se revisaron adicionalmente `.gitignore` (raíz y `apps/api/`) para confirmar que los patrones de exclusión de archivos sensibles están correctamente configurados.

## 3. Hallazgos

### 3.1 🔴 Crítico — Contraseña de administrador hardcodeada

| Campo | Detalle |
|---|---|
| Archivo | `infra/scripts/provision.sh` |
| Línea | 687 |
| Commit de introducción | `9874291` — "Documentacion de DB y script de arquitectura cosmosDB" |
| Autor | valtabpul |
| Fecha | 2026-07-27 |
| Estado en HEAD | Presente sin modificar |

```bash
az sql server create \
    --name "$SQL_SERVER_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --location "$LOCATION" \
    --admin-user "admincentinela" \
    --admin-password "PasswordSeguro123!"
```

**Por qué es un hallazgo crítico:** es una credencial de administrador de un almacén relacional real, escrita en texto plano en un script versionado dentro de un repositorio público de GitHub. No requiere reconstrucción ni descifrado — es utilizable directamente por cualquiera con acceso de lectura al repositorio.

**Implicación de seguridad:** al haber sido publicada en un repositorio público, esta credencial debe tratarse como **comprometida**, independientemente de si se elimina del código. Si el script llegó a ejecutarse contra una suscripción real con este valor, el servidor SQL provisionado tiene actualmente esa contraseña activa.

### 3.2 🟡 Menor — Connection string de Application Insights como variable de entorno en texto plano

| Campo | Detalle |
|---|---|
| Archivo | `infra/scripts/provision.sh` |
| Línea | 620–623 |
| Naturaleza | Configuración de App Setting vía script, no tecleada manualmente en el portal |

```bash
az webapp config appsettings set \
    --name "$APP_SERVICE_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --settings APPLICATIONINSIGHTS_CONNECTION_STRING="$APP_INSIGHTS_KEY" >/dev/null
```

**Severidad:** baja. El connection string de Application Insights es un endpoint de ingesta de telemetría, no una credencial de acceso a datos de negocio; su exposición no compromete transacciones ni casos de fraude. Se documenta igual porque el criterio 2.6 del proyecto exige que ninguna cadena de conexión resida fuera de un gestor de secretos, sin excepción por tipo de servicio.

### 3.3 Verificado sin hallazgos

- Ningún archivo `.env`, `.env.*` o similar fue agregado en ningún commit de la rama `develop` en ningún momento de su historia.
- `.gitignore` (raíz y `apps/api/`) excluye correctamente `.env`, `.env.local`, `.env.*.local`, `.terraform/`, `*.tfstate`, `*.tfvars`.
- El connection string de la cuenta de Storage (`infra/scripts/provision.sh`, líneas 366–370) se obtiene dinámicamente vía `az storage account show-connection-string` y se usa únicamente en memoria dentro de la ejecución del script — no se hardcodea, no se persiste en archivo, no se imprime a stdout.
- El connection string del SQL Server no se recupera ni se almacena en el script más allá de la creación inicial.
- Sin API keys, tokens de terceros, ni claves privadas (`-----BEGIN`) en código de aplicación (`apps/api/`), tests, ni configuración (`package.json`, `tsconfig.json`, workflows).
- `variables.sh` contiene únicamente nombres y rangos de recursos parametrizables — ninguno es un secreto.

## 4. Remediación

| # | Hallazgo | Acción requerida | Responsable | Estado |
|---|---|---|---|---|
| 1 | Password hardcodeado (3.1) | Reemplazar por generación aleatoria en tiempo de ejecución (`openssl rand`) + almacenamiento inmediato en Key Vault; evaluar migrar a autenticación Azure AD-only en el SQL Server para eliminar la contraseña por completo | Por asignar | Pendiente |
| 2 | Rotación en Azure | Si el script ya se ejecutó contra una suscripción real con este valor, rotar la contraseña del servidor SQL en Azure de inmediato, sin esperar a la limpieza del repositorio | Por asignar | **Urgente — verificar hoy** |
| 3 | App setting en texto plano (3.2) | Migrar `APPLICATIONINSIGHTS_CONNECTION_STRING` a referencia de Key Vault (`@Microsoft.KeyVault(...)`) en los App Settings | Por asignar | Pendiente |
| 4 | Historial de git | Evaluar reescritura de historial (`git filter-repo`) para el commit `9874291` una vez rotada la credencial real; requiere coordinación de equipo por ser una acción destructiva sobre una rama compartida | Por asignar | Pendiente de decisión |

La reescritura de historial (#4) solo tiene sentido **después** de rotar la credencial real (#2): limpiar el repositorio no protege un secreto que ya fue usado y puede seguir activo en Azure.

## 5. Trazabilidad de la auditoría

- Reporte JSON de Gitleaks (historial): `gitleaks-report.json`
- Reporte JSON de Gitleaks (árbol de trabajo): `gitleaks-dir-report.json`
- Ambos reportes se adjuntan como evidencia de la ejecución en la bitácora de la tarea CEN-47.

## 6. Checklist de cierre — CEN-45 / CEN-46 / CEN-47

- [ ] CEN-45 — Ningún secreto existe en el código actual → **no cumple** (hallazgo 3.1 pendiente de remediar)
- [ ] CEN-46 — Ningún secreto existe en variables de entorno configuradas manualmente → **cumple parcialmente** (hallazgo 3.2, severidad baja, pendiente de remediar)
- [x] CEN-47 — Historial de control de versiones auditado para verificar ausencia de secretos → **completado**, con un hallazgo crítico documentado y su commit de origen identificado

Esta tarea (CEN-37) no puede marcarse como completada hasta resolver el punto 1 y verificar el punto 2 de la tabla de remediación.