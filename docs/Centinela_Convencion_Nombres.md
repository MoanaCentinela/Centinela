# Convención de nombres de recursos

Esta guía resume la convención usada por los scripts de infraestructura y por la documentación del proyecto.

## 1. Base actual

Los nombres usados actualmente por los scripts se definen en [infra/scripts/variables.sh](../infra/scripts/variables.sh) y están alineados con la implementación actual del repositorio.

| Recurso | Nombre actual |
|---|---|
| Resource Group | `rg-centinela-dev` |
| VNet | `centinela-vnet-dev` |
| Subred App | `centinela-snet-app-dev` |
| Subred Data | `centinela-snet-data-dev` |
| Subred Future | `centinela-snet-future-dev` |
| App Service Plan | `asp-centinela-dev` |
| Web App | `centinela-api-dev` |
| Storage Account | `stcentinela2607` |
| Blob Container | `raw-data` |
| Queue | `cola-transacciones` |

## 2. Regla general

Los nombres siguen el patrón:

```text
<proyecto>-<tipo>-<ambiente>
```

Con las excepciones de recursos globales como Storage Accounts, que deben ser únicos en Azure y por eso se usan nombres cortos y deterministas.

## 3. Alineación con los scripts

Los scripts de infraestructura consultan estos nombres desde [infra/scripts/variables.sh](../infra/scripts/variables.sh), de forma que no se repiten valores dispersos en el código.

## 4. Recomendación para futuras ampliaciones

Si se agregan nuevos recursos, conviene mantener el mismo patrón y centralizar los nombres en el archivo de variables para que el aprovisionamiento siga siendo idempotente.
