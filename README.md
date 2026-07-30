# Centinela

Sistema de detección de fraude transaccional en tiempo real desarrollado sobre Azure con una arquitectura orientada a eventos y un monolito modular.

## Scripts disponibles

- Provisionamiento: ./infra/scripts/provision.sh
- Despliegue: ./infra/scripts/deploy.sh
- Eliminación: ./infra/scripts/destroy.sh

## Variables de entorno

Los scripts leen valores base desde [infra/scripts/variables.sh](infra/scripts/variables.sh). Se pueden sobrescribir desde el entorno antes de ejecutar cualquier script:

```bash
RESOURCE_GROUP="rg-centinela-dev" \
LOCATION="chilecentral" \
./infra/scripts/provision.sh
```

## Documentación

- [docs/Centinela_README.md](docs/Centinela_README.md)
- [docs/deployment.md](docs/deployment.md)
