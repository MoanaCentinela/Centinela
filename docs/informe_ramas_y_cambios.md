# Informe de Ramas y Cambios Recientes — Centinela

Este documento detalla los cambios realizados en nuestra sesión de trabajo actual y ofrece una guía completa de las ramas del proyecto, explicando el propósito y contenido de cada una.

---

## 1. ¿Qué hemos hecho por nuestra parte?

Hemos resuelto la tarea **Configurar Aislamiento de Red del Almacén de Casos (SQL)**. Este almacén de datos (Azure SQL Database) contiene información sensible de casos de fraude y requería estar aislado del internet público sin generar costos adicionales.

### Acciones técnicas completadas:
1. **Centralización de Variables**: Trasladamos las variables del servidor SQL lógico a [variables.sh](file:///c:/Users/park0/Centinela/infra/scripts/variables.sh) para facilitar su gestión.
2. **Service Endpoint `Microsoft.Sql`**: Actualizamos [provision.sh](file:///c:/Users/park0/Centinela/infra/scripts/provision.sh) para habilitar este endpoint de servicio en la subred de aplicación. Esto permite que el tráfico hacia la base de datos viaje de manera segura a través de la infraestructura interna de Azure.
3. **Regla de Red Virtual (VNet Rule)**: Configuramos Azure SQL Database para que acepte conexiones exclusivamente procedentes de la subred de aplicación (`centinela-snet-app-dev`) y deniegue cualquier otro tráfico público por defecto.
4. **Regla de Salida de NSG**: Agregamos la regla de seguridad `Allow-SQL-Outbound` (puerto `1433`, TCP) en el NSG de la subred de aplicación. Sin esta regla, el cortafuegos restrictivo de la subred habría bloqueado los intentos de la API para conectarse al servidor SQL.
5. **Documentación de Red**: Registramos toda esta arquitectura y actualizamos las tablas de NSG y el diagrama conceptual en [Centinela_Topologia_Red.md](file:///c:/Users/park0/Centinela/docs/Centinela_Topologia_Red.md).

---

## 2. Mapa de Ramas del Repositorio

El repositorio cuenta con las siguientes ramas de trabajo. Aquí tienes qué hace cada una de ellas:

### 🟢 Ramas Principales

*   **`main`**:
    *   **Propósito**: Rama estable del sistema. Contiene el código listo para entornos de producción.
*   **`develop`**:
    *   **Propósito**: Rama de integración de desarrollo. Es la base de donde parten todas las características (`feature/*`) y donde se fusionan una vez validadas.

---

### 🛠️ Ramas de Características (`feature/*`)

*   **`feature/aislamiento-red-sql`** *(Rama actual de trabajo)*:
    *   **Propósito**: Implementa el aislamiento de red del servidor lógico de base de datos relacional de casos (`CasosFraudeDB`) mediante Service Endpoints, bloqueando el tráfico de internet público y permitiendo acceso solo desde la subred de la API.
*   **`feature/motor-de-scoring-y-reglas`**:
    *   **Propósito**: Implementa el motor de puntuación de transacciones en tiempo real. Evalúa los payloads entrantes contra un conjunto de reglas de negocio para clasificar si una transacción es sospechosa.
    *   **Componentes**: Contiene las reglas individuales de validación (límites de monto, velocidad de transacciones, comercios de riesgo, etc.).
*   **`feature/configuracion-de-almacenamiento`**:
    *   **Propósito**: Define los puertos de almacenamiento (`CaseRepository`), desacopla la mensajería y la persistencia del negocio, y centraliza la configuración de entorno en la API de NodeJS.
*   **`feature/regla-geo-imposible`**:
    *   **Propósito**: Desarrolla la regla específica del motor de scoring que detecta fraudes basándose en la distancia física y el intervalo de tiempo entre dos transacciones sucesivas de una misma cuenta (ej. transacciones realizadas a miles de kilómetros de distancia con pocos minutos de diferencia).
*   **`feature/implement-rate-limiting`**:
    *   **Propósito**: Protege la API de ingesta contra ataques de denegación de servicio (DoS) y ráfagas masivas. Configura un límite de tasa (*rate limit*) de 100 peticiones por minuto por dirección IP utilizando el módulo `@fastify/rate-limit`.
*   **`feature/red-desing-and-traffic-rules`**:
    *   **Propósito**: Diseña la topología de red virtual (VNet, subredes `app`, `data` y `future`) y configura las reglas perimetrales cerradas por defecto (*deny-by-default*) en los NSGs de Azure.
*   **`feature/primeros-pasos-ingesta`**:
    *   **Propósito**: Establece el esqueleto del proyecto NodeJS con TypeScript/Fastify, configura los archivos de integración (`.gitignore`, `package.json`, etc.) y crea reportes iniciales de cuotas de recursos en Azure.

---

## 3. Estado de Sincronización Local vs. Remoto

*   Todas las ramas remotas han sido importadas al entorno local.
*   Puedes cambiar de una rama a otra utilizando el comando:
    ```bash
    git checkout <nombre-de-rama>
    ```
    *(Por ejemplo, para volver a la rama de integración principal: `git checkout develop`)*.
