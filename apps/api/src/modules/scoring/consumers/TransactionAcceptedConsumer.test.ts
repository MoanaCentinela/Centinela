import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "../../../app.js";
import { MemoryCaseRepository } from "../../../infrastructure/cases/MemoryCaseRepository.js";

describe("End-to-End Event-Driven Scoring Integration Test", () => {
  let app: any;
  let caseRepository: MemoryCaseRepository;

  beforeAll(async () => {
    caseRepository = new MemoryCaseRepository();
    app = await buildApp({ caseRepository });
  });

  afterAll(async () => {
    await app.close();
  });

  it("debe procesar la transacción de forma asíncrona y abrir un caso de fraude si supera el umbral", async () => {
    // 1. Enviar transacción sospechosa a la API de Ingesta (comercio de riesgo MERCH-999)
    const payload = {
      transactionId: "trx-e2e-001",
      accountId: "acc-e2e-100",
      amount: 4200000,
      currency: "USD",
      clientTimestamp: new Date().toISOString(),
      location: { latitude: 6.2442, longitude: -75.5812 },
      merchant: { id: "MERCH-999", category: "CASINO" },
    };

    const response = await app.inject({
      method: "POST",
      url: "/transactions",
      payload,
    });

    // 2. La API debe responder de inmediato con 202 Accepted sin colgar la petición
    expect(response.statusCode).toBe(202);
    const body = JSON.parse(response.payload);
    expect(body.success).toBe(true);
    expect(body.message).toContain("recibida correctamente");

    // 3. El consumidor desacoplado ya debió haber procesado el evento y creado el caso de fraude
    const cases = await caseRepository.findAllCases();
    expect(cases.length).toBeGreaterThan(0);

    const fraudCase = cases.find((c) => c.transactionId === "trx-e2e-001");
    expect(fraudCase).toBeDefined();
    expect(fraudCase?.status).toBe("OPEN");
    expect(fraudCase?.score).toBeGreaterThanOrEqual(60);
    expect(fraudCase?.explanations.length).toBeGreaterThan(0);
    expect(fraudCase?.explanations[0]).toContain("alto riesgo");
  });
});
