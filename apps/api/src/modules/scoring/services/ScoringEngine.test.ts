import { describe, it, expect, beforeEach } from "vitest";
import { ScoringEngine } from "./ScoringEngine.js";
import { RuleEngine } from "../engine/RuleEngine.js";
import { VelocityRule } from "../rules/VelocityRule.js";
import { AmountRule } from "../rules/AmountRule.js";
import { ImpossibleGeoRule } from "../rules/ImpossibleGeoRule.js";
import { RiskMerchantRule } from "../rules/RiskMerchantRule.js";
import { MemoryTransactionHistoryProvider } from "../../../infrastructure/history/MemoryTransactionHistoryProvider.js";
import { MemoryCaseRepository } from "../../../infrastructure/cases/MemoryCaseRepository.js";
import { TransactionRequest } from "../../../shared/contracts/index.js";

describe("ScoringEngine & Independent Fraud Rules", () => {
  let ruleEngine: RuleEngine;
  let historyProvider: MemoryTransactionHistoryProvider;
  let caseRepository: MemoryCaseRepository;
  let scoringEngine: ScoringEngine;

  beforeEach(() => {
    ruleEngine = new RuleEngine([
      new VelocityRule(3, 35),
      new AmountRule(5, 30),
      new ImpossibleGeoRule(900, 50),
      new RiskMerchantRule(["MERCH-999"], ["CASINO"], 40),
    ]);
    historyProvider = new MemoryTransactionHistoryProvider();
    caseRepository = new MemoryCaseRepository();

    scoringEngine = new ScoringEngine({
      ruleEngine,
      historyProvider,
      caseRepository,
    });
  });

  it("debe retornar score 0 y no abrir caso ante una transacción normal", async () => {
    const transaction: TransactionRequest = {
      transactionId: "trx-001",
      accountId: "acc-100",
      amount: 50000,
      currency: "USD",
      clientTimestamp: new Date().toISOString(),
      location: { latitude: 6.2442, longitude: -75.5812 },
      merchant: { id: "MERCH-OK", category: "ELECTRONICS" },
    };

    const result = await scoringEngine.evaluateTransaction(transaction);

    expect(result.totalScore).toBe(0);
    expect(result.isFraud).toBe(false);
    expect(result.caseId).toBeUndefined();
    expect(result.explanations).toHaveLength(0);
  });

  it("debe activar RiskMerchantRule y sumar 40 puntos si el comercio está en lista negra", async () => {
    const transaction: TransactionRequest = {
      transactionId: "trx-002",
      accountId: "acc-100",
      amount: 10000,
      currency: "USD",
      clientTimestamp: new Date().toISOString(),
      location: { latitude: 6.2442, longitude: -75.5812 },
      merchant: { id: "MERCH-999", category: "ELECTRONICS" },
    };

    const result = await scoringEngine.evaluateTransaction(transaction);

    expect(result.totalScore).toBe(40);
    expect(result.isFraud).toBe(false); // 40 < 60 (threshold por defecto)
  });

  it("debe acumular score y abrir un caso de fraude cuando el score supera el umbral", async () => {
    // 1. Guardar transacciones históricas previas con monto promedio $10,000
    await historyProvider.saveTransaction({
      transactionId: "trx-prev-1",
      accountId: "acc-200",
      amount: 10000,
      currency: "USD",
      clientTimestamp: new Date().toISOString(),
      location: { latitude: 6.2442, longitude: -75.5812 },
      merchant: { id: "MERCH-OK", category: "RETAIL" },
    });
    await historyProvider.saveTransaction({
      transactionId: "trx-prev-2",
      accountId: "acc-200",
      amount: 10000,
      currency: "USD",
      clientTimestamp: new Date().toISOString(),
      location: { latitude: 6.2442, longitude: -75.5812 },
      merchant: { id: "MERCH-OK", category: "RETAIL" },
    });

    // 2. Nueva transacción con monto atípico ($1,000,000 > 5x promedio) y comercio de riesgo
    const highRiskTransaction: TransactionRequest = {
      transactionId: "trx-risk-1",
      accountId: "acc-200",
      amount: 1000000,
      currency: "USD",
      clientTimestamp: new Date().toISOString(),
      location: { latitude: 6.2442, longitude: -75.5812 },
      merchant: { id: "MERCH-999", category: "CASINO" },
    };

    const result = await scoringEngine.evaluateTransaction(highRiskTransaction);

    expect(result.totalScore).toBeGreaterThanOrEqual(60); // AmountRule (30) + RiskMerchantRule (40) = 70
    expect(result.isFraud).toBe(true);
    expect(result.caseId).toBeDefined();
    expect(result.explanations.length).toBeGreaterThan(0);

    // Verificar que el caso quedó persistido en CaseRepository
    const savedCase = await caseRepository.findCaseById(result.caseId!);
    expect(savedCase).not.toBeNull();
    expect(savedCase?.score).toBe(result.totalScore);
    expect(savedCase?.status).toBe("OPEN");
  });

  it("debe detectar Ubicación Geográficamente Imposible si la velocidad supera 900 km/h", async () => {
    const prevTimestamp = new Date(Date.now() - 10 * 60 * 1000).toISOString(); // Hace 10 minutos en Medellín
    await historyProvider.saveTransaction({
      transactionId: "trx-medellin",
      accountId: "acc-300",
      amount: 50000,
      currency: "USD",
      clientTimestamp: prevTimestamp,
      location: { latitude: 6.2442, longitude: -75.5812 }, // Medellín
      merchant: { id: "MERCH-MED", category: "RETAIL" },
    });

    // 10 minutos después en Madrid (~8000 km de distancia)
    const geoTransaction: TransactionRequest = {
      transactionId: "trx-madrid",
      accountId: "acc-300",
      amount: 50000,
      currency: "USD",
      clientTimestamp: new Date().toISOString(),
      location: { latitude: 40.4168, longitude: -3.7038 }, // Madrid
      merchant: { id: "MERCH-MAD", category: "RETAIL" },
    };

    const result = await scoringEngine.evaluateTransaction(geoTransaction);

    expect(result.totalScore).toBe(50); // Geo-imposible (+50 puntos)
    expect(result.explanations[0]).toContain("La transacción anterior se originó hace");
  });
});
