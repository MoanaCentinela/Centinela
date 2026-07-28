import Fastify from "fastify";
import rateLimit from "@fastify/rate-limit";
import { transactionRoutes } from "./modules/ingestion/controllers/transaction.routes.js";
import { ApiResponse } from "./responses/index.js";
import { TransactionService } from "./modules/ingestion/services/TransactionService.js";
import { EnvironmentConfigurationProvider } from "./shared/config/EnvironmentConfigurationProvider.js";
import { InMemoryEventPublisher } from "./infrastructure/queue/InMemoryEventPublisher.js";
import { ConsoleLogger } from "./infrastructure/logging/ConsoleLogger.js";

// Función factory para crear y configurar la aplicación Fastify.
// Esto permite instanciarla y probarla de forma aislada en las pruebas sin ocupar un puerto de red real.
export async function buildApp() {
  const app = Fastify({
    logger: false, // Desactivamos el logger en pruebas para evitar contaminación de consola, en producción se configura en server.ts
  });

  const transactionService = new TransactionService({
    eventPublisher: new InMemoryEventPublisher(),
    ruleLogger: new ConsoleLogger(),
    configuration: new EnvironmentConfigurationProvider(),
  });

  // Registrar el plugin de control de tasa (@fastify/rate-limit)
  // para proteger la API contra saturación y denegación de servicio (DoS).
  await app.register(rateLimit, {
    // Número máximo de peticiones permitidas en la ventana de tiempo.
    max: 100,
    // Ventana de tiempo establecida a 1 minuto.
    timeWindow: "1 minute",
    // Usar almacenamiento en memoria LRU por defecto.
    // Personalización del formato de respuesta ante el error HTTP 429 (Too Many Requests).
    errorResponseBuilder: (request, context) => {
      const apiResponse = ApiResponse.error(
        "Límite de peticiones excedido. Por favor, intente de nuevo más tarde.",
        [
          `Límite: ${context.max} peticiones`,
          `Ventana: ${context.after}`,
        ]
      );
      return {
        ...apiResponse,
        statusCode: 429,
      };
    },
  });

  // Registrar las rutas de transacciones.
  await app.register(transactionRoutes, { service: transactionService });

  return app;
}
