import { TransactionValidator } from "../../validation/services/TransactionValidator.js";
import { MemoryTransactionRepository } from "../repositories/MemoryTransactionRepository.js";
import { TransactionRequest } from "../../../shared/contracts/index.js";
import { EventPublisher } from "../../../shared/ports/EventPublisher.js";
import { RuleLogger } from "../../../shared/ports/RuleLogger.js";
import { ConfigurationProvider } from "../../../shared/config/ConfigurationProvider.js";
import { RuleEvaluation } from "../../../shared/models/RuleEvaluation.js";
import { TransactionAcceptedEvent } from "../../../shared/contracts/events/index.js";
import type { TransactionRepository } from "../../../shared/ports/TransactionRepository.js";

export interface TransactionServiceDependencies {
  validator?: TransactionValidator;
  repository?: TransactionRepository;
  eventPublisher?: EventPublisher;
  ruleLogger?: RuleLogger;
  configuration?: ConfigurationProvider;
}

export class TransactionService {
  private readonly validator: TransactionValidator;
  private readonly repository: TransactionRepository;
  private readonly eventPublisher: EventPublisher;
  private readonly ruleLogger: RuleLogger;
  private readonly configuration: ConfigurationProvider;

  constructor(dependencies: TransactionServiceDependencies = {}) {
    this.validator = dependencies.validator ?? new TransactionValidator();
    this.repository = dependencies.repository ?? new MemoryTransactionRepository();
    this.eventPublisher = dependencies.eventPublisher ?? { publish: async () => undefined };
    this.ruleLogger = dependencies.ruleLogger ?? { log: () => undefined };
    this.configuration = dependencies.configuration ?? {
      get: () => undefined,
    };
  }

  async processTransaction(transaction: TransactionRequest) {
    const errors = this.validator.validate(transaction);

    if (errors.length > 0) {
      return {
        success: false,
        message: "La transacción contiene errores de validación.",
        errors,
      };
    }

    const exists = await this.repository.exists(transaction.transactionId);

    if (exists) {
      return {
        success: true,
        duplicate: true,
        message: `La transacción ${transaction.transactionId} ya fue recibida.`,
      };
    }

    await this.repository.save(transaction);

    const threshold = this.getThreshold();
    const score = this.calculateScore(transaction.amount);
    const ruleEvaluation: RuleEvaluation = {
      ruleName: "amount-threshold",
      observedValue: score,
      threshold,
      explanation: "El valor observado del score supera el umbral configurado.",
      result: score >= threshold ? "passed" : "failed",
      timestamp: new Date().toISOString(),
    };

    this.ruleLogger.log(ruleEvaluation);

    const event: TransactionAcceptedEvent = {
      eventType: "TransactionAccepted",
      transactionId: transaction.transactionId,
      accountId: transaction.accountId,
      occurredAt: new Date().toISOString(),
    };

    await this.eventPublisher.publish(event);

    return {
      success: true,
      duplicate: false,
      message: "Transacción recibida correctamente.",
    };
  }

  private getThreshold(): number {
    const configuredValue = this.configuration.get("SCORE_THRESHOLD");

    if (typeof configuredValue === "number") {
      return configuredValue;
    }

    return 1000;
  }

  private calculateScore(amount: number): number {
    return amount > 0 ? Math.round(amount / 10) : 0;
  }
}