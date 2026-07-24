# Topología de red

Esta guía describe la topología base aprovisionada por los scripts actuales.

## 1. Red virtual

| Parámetro | Valor |
|---|---|
| Nombre | `centinela-vnet-dev` |
| Rango | `10.0.0.0/16` |
| Región | `chilecentral` |

## 2. Subredes

| Subred | Nombre | Rango |
|---|---|---|
| Aplicación | `centinela-snet-app-dev` | `10.0.1.0/24` |
| Datos | `centinela-snet-data-dev` | `10.0.2.0/24` |
| Futuro | `centinela-snet-future-dev` | `10.0.3.0/24` |

## 3. Objetivo de diseño

La topología busca que la API de ingesta sea el único punto de entrada público y que el acceso a los recursos de datos quede restringido a la subred de aplicación.

## 4. Alineación con la implementación

Los nombres y rangos de red usados en esta guía coinciden con los valores definidos en [infra/scripts/variables.sh](../infra/scripts/variables.sh) y con el aprovisionamiento ejecutado por [infra/scripts/provision.sh](../infra/scripts/provision.sh).
