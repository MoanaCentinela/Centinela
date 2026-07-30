import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "../../../app.js";

describe("Case Management Routes (REST API)", () => {
  let app: any;
  let analystToken: string;

  beforeAll(async () => {
    app = await buildApp();

    const loginRes = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { username: "analista", password: "Analista123!" },
    });
    analystToken = JSON.parse(loginRes.payload).data.token;
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /cases debe retornar lista vacía inicialmente", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/cases",
      headers: { authorization: `Bearer ${analystToken}` },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it("debe crear un caso vía POST /transactions sospechoso y permitir consultarlo vía GET /cases", async () => {
    // 1. Enviar transacción sospechosa
    const postRes = await app.inject({
      method: "POST",
      url: "/transactions",
      payload: {
        transactionId: "trx-case-test-100",
        accountId: "acc-test-999",
        amount: 5000000,
        currency: "USD",
        clientTimestamp: new Date().toISOString(),
        location: { latitude: 6.2442, longitude: -75.5812 },
        merchant: { id: "MERCH-999", category: "CASINO" },
      },
    });

    expect(postRes.statusCode).toBe(202);

    // 2. Consultar lista de casos
    const getRes = await app.inject({
      method: "GET",
      url: "/cases",
      headers: { authorization: `Bearer ${analystToken}` },
    });

    expect(getRes.statusCode).toBe(200);
    const cases = JSON.parse(getRes.payload).data;
    expect(cases.length).toBeGreaterThan(0);

    const createdCase = cases.find((c: any) => c.transactionId === "trx-case-test-100");
    expect(createdCase).toBeDefined();

    // 3. Consultar caso por ID
    const getByIdRes = await app.inject({
      method: "GET",
      url: `/cases/${createdCase.id}`,
      headers: { authorization: `Bearer ${analystToken}` },
    });

    expect(getByIdRes.statusCode).toBe(200);
    const caseDetail = JSON.parse(getByIdRes.payload).data;
    expect(caseDetail.id).toBe(createdCase.id);

    // 4. Resolver caso vía PATCH /cases/:id/resolve
    const resolveRes = await app.inject({
      method: "PATCH",
      url: `/cases/${createdCase.id}/resolve`,
      headers: { authorization: `Bearer ${analystToken}` },
      payload: {
        decision: "CONFIRMED_FRAUD",
        notes: "Transacción confirmada como fraude por el analista.",
        analystId: "ANALYST-007",
      },
    });

    expect(resolveRes.statusCode).toBe(200);
    const resolvedCase = JSON.parse(resolveRes.payload).data;
    expect(resolvedCase.status).toBe("RESOLVED");
    expect(resolvedCase.resolution.decision).toBe("CONFIRMED_FRAUD");

    // 5. Adjuntar documento vía POST /cases/:id/documents
    const docRes = await app.inject({
      method: "POST",
      url: `/cases/${createdCase.id}/documents`,
      headers: { authorization: `Bearer ${analystToken}` },
      payload: {
        filename: "cedula_analista.pdf",
        documentType: "ID_CARD",
        extractedData: { idNumber: "1098765432", name: "Juan Perez" },
      },
    });

    expect(docRes.statusCode).toBe(200);
    const docCase = JSON.parse(docRes.payload).data;
    expect(docCase.documents.length).toBe(1);
    expect(docCase.documents[0].filename).toBe("cedula_analista.pdf");
  });
});
