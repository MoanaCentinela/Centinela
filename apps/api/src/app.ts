import Fastify from "fastify";
import rateLimit from "@fastify/rate-limit";
import { transactionRoutes } from "./modules/ingestion/controllers/transaction.routes.js";
import { caseRoutes } from "./modules/cases/controllers/case.routes.js";
import { ApiResponse } from "./responses/index.js";
import { TransactionService } from "./modules/ingestion/services/TransactionService.js";
import { CaseService } from "./modules/cases/services/CaseService.js";
import { EnvironmentConfigurationProvider } from "./shared/config/EnvironmentConfigurationProvider.js";
import { InMemoryEventPublisher } from "./infrastructure/queue/InMemoryEventPublisher.js";
import { ConsoleLogger } from "./infrastructure/logging/ConsoleLogger.js";
import { MemoryTransactionRepository } from "./modules/ingestion/repositories/MemoryTransactionRepository.js";
import { MemoryTransactionHistoryProvider } from "./infrastructure/history/MemoryTransactionHistoryProvider.js";
import { MemoryCaseRepository } from "./infrastructure/cases/MemoryCaseRepository.js";
import { RuleEngine } from "./modules/scoring/engine/RuleEngine.js";
import { VelocityRule } from "./modules/scoring/rules/VelocityRule.js";
import { AmountRule } from "./modules/scoring/rules/AmountRule.js";
import { ImpossibleGeoRule } from "./modules/scoring/rules/ImpossibleGeoRule.js";
import { RiskMerchantRule } from "./modules/scoring/rules/RiskMerchantRule.js";
import { ScoringEngine } from "./modules/scoring/services/ScoringEngine.js";
import { TransactionAcceptedConsumer } from "./modules/scoring/consumers/TransactionAcceptedConsumer.js";

export async function buildApp(options: {
  eventPublisher?: InMemoryEventPublisher;
  caseRepository?: MemoryCaseRepository;
} = {}) {
  const app = Fastify({
    logger: false,
  });

  const configuration = new EnvironmentConfigurationProvider();
  const eventPublisher = options.eventPublisher ?? new InMemoryEventPublisher();
  const caseRepository = options.caseRepository ?? new MemoryCaseRepository();
  const historyProvider = new MemoryTransactionHistoryProvider();
  const repository = new MemoryTransactionRepository(historyProvider);

  const ruleEngine = new RuleEngine([
    new VelocityRule(3, 35),
    new AmountRule(5, 30),
    new ImpossibleGeoRule(900, 50),
    new RiskMerchantRule(["MERCH-999", "CRYPTO-EX-01", "CASINO-VIP"], ["CASINO", "CRYPTO"], 65),
  ]);

  const scoringEngine = new ScoringEngine({
    ruleEngine,
    historyProvider,
    caseRepository,
    configuration,
  });

  const consumer = new TransactionAcceptedConsumer(scoringEngine, repository);

  // Suscribir el consumidor al evento TransactionAccepted emitido por la ingesta
  eventPublisher.subscribe("TransactionAccepted", async (event) => {
    await consumer.handle(event);
  });

  const transactionService = new TransactionService({
    validator: undefined,
    repository,
    eventPublisher,
    ruleLogger: new ConsoleLogger(),
    configuration,
  });

  const caseService = new CaseService(caseRepository);

  await app.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
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

  await app.register(transactionRoutes, { service: transactionService });
  await app.register(caseRoutes, { service: caseService });

  // Exponer el repositorio de casos en la instancia para inspección en pruebas/consultas
  (app as any).caseRepository = caseRepository;

  return app;
}
