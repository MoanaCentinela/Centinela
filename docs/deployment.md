# Decisión de despliegue

## Servicio seleccionado

Azure App Service

## Justificación

La API de ingesta debe ejecutarse como un servicio siempre disponible.

En fases posteriores necesitará integración con una Virtual Network (VNet Integration), requisito que no está disponible en el plan Consumption de Azure Functions.

Azure App Service permite:

- API siempre disponible.
- Escalado sencillo.
- Integración con VNet.
- Despliegue mediante GitHub Actions.
- Administración simplificada.

## Plan seleccionado

Durante el desarrollo se utilizará el nivel más bajo que soporte Virtual Network Integration, minimizando el costo sin afectar la arquitectura definida para Centinela.