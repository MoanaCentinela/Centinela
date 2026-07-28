import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "../../../app.js";

// Suite de pruebas de integración para el control de tasa (Rate Limiting)
describe("Rate Limiting Integration Tests", () => {
  let app: any;

  beforeAll(async () => {
    // Construir la aplicación antes de correr las pruebas
    app = await buildApp();
  });

  afterAll(async () => {
    // Cerrar la aplicación al finalizar las pruebas
    await app.close();
  });

  it("should allow requests under the limit and block with 429 once limit is exceeded", async () => {
    // El límite configurado es de 100 solicitudes por minuto.
    // Inyectamos 100 peticiones rápidas. Todas deben ser procesadas
    // y retornar 400 (Bad Request debido a payload vacío) en lugar de 429.
    for (let i = 0; i < 100; i++) {
      const response = await app.inject({
        method: "POST",
        url: "/transactions",
        payload: {}, // Payload vacío para gatillar error 400 rápido
      });

      expect(response.statusCode).toBe(400);
    }

    // La petición número 101 debe ser bloqueada por el control de tasa
    // retornando un código de estado HTTP 429 (Too Many Requests).
    const blockedResponse = await app.inject({
      method: "POST",
      url: "/transactions",
      payload: {},
    });

    expect(blockedResponse.statusCode).toBe(429);

    // Validar el formato estructurado del error 429 usando ApiResponse
    const responseBody = JSON.parse(blockedResponse.payload);
    expect(responseBody.success).toBe(false);
    expect(responseBody.message).toContain("Límite de peticiones excedido");
    expect(responseBody.errors).toBeDefined();
    expect(responseBody.errors[0]).toBe("Límite: 100 peticiones");
    expect(responseBody.errors[1]).toContain("Ventana:");
  });
});
