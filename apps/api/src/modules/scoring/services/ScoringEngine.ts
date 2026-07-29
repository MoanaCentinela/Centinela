import { RuleEngine } from "../engine/RuleEngine.js";
import { TransactionHistoryProvider } from "../../../shared/ports/TransactionHistoryProvider.js";
import { CaseRepository } from "../../../shared/ports/CaseRepository.js";
import { CasePublisher } from "../../../shared/ports/CasePublisher.js";
import { ConfigurationProvider } from "../../../shared/config/ConfigurationProvider.js";
import { TransactionRequest } from "../../../shared/contracts/index.js";
import { FraudCase } from "../../../shared/models/FraudCase.js";
import { RuleContext, FraudRuleResult } from "../../../shared/ports/FraudRule.js";

export interface ScoringEngineDependencies {
  ruleEngine?: RuleEngine;
  historyProvider?: TransactionHistoryProvider;
  caseRepository?: CaseRepository;
  casePublisher?: CasePublisher;
  configuration?: ConfigurationProvider;
}

export interface ScoringResult {
  transactionId: string;
  accountId: string;
  totalScore: number;
  threshold: number;
  isFraud: boolean;
  caseId?: string;
  ruleEvaluations: FraudRuleResult[];
  explanations: string[];
}

export class ScoringEngine {
  private readonly ruleEngine: RuleEngine;
  private readonly historyProvider: TransactionHistoryProvider;
  private readonly caseRepository: CaseRepository;
  private readonly casePublisher?: CasePublisher;
  private readonly configuration: ConfigurationProvider;

  constructor(dependencies: ScoringEngineDependencies) {
    this.ruleEngine = dependencies.ruleEngine ?? new RuleEngine();
    this.historyProvider = dependencies.historyProvider ?? {
      getRecentTransactions: async () => [],
      getAccountHistoricalAverage: async () => 0,
      saveTransaction: async () => undefined,
    };
    this.caseRepository = dependencies.caseRepository ?? {
      saveCase: async () => undefined,
      findCaseById: async () => null,
      findCaseByTransactionId: async () => null,
      findAllCases: async () => [],
    };
    this.casePublisher = dependencies.casePublisher;
    this.configuration = dependencies.configuration ?? { get: () => undefined };
  }

  async evaluateTransaction(transaction: TransactionRequest): Promise<ScoringResult> {
    const recentTransactions = await this.historyProvider.getRecentTransactions(transaction.accountId);
    const accountHistoricalAverage = await this.historyProvider.getAccountHistoricalAverage(transaction.accountId);

    const context: RuleContext = {
      recentTransactions,
      accountHistoricalAverage,
    };

    const ruleEvaluations = await this.ruleEngine.executeAll(transaction, context);

    const totalScore = ruleEvaluations
      .filter((res) => res.triggered)
      .reduce((sum, res) => sum + res.points, 0);

    const threshold = this.getThreshold();
    const isFraud = totalScore >= threshold;
    const explanations = ruleEvaluations
      .filter((res) => res.triggered)
      .map((res) => res.explanation);

    let caseId: string | undefined;

    if (isFraud) {
      caseId = `CASE-${Date.now()}-${transaction.transactionId.substring(0, 8)}`;
      const fraudCase: FraudCase = {
        id: caseId,
        transactionId: transaction.transactionId,
        accountId: transaction.accountId,
        score: totalScore,
        threshold,
        status: "OPEN",
        createdAt: new Date().toISOString(),
        explanations,
        ruleEvaluations,
      };

      await this.caseRepository.saveCase(fraudCase);

      if (this.casePublisher) {
        await this.casePublisher.publish({
          caseId: fraudCase.id,
          transactionId: fraudCase.transactionId,
          score: fraudCase.score,
          status: fraudCase.status,
        });
      }
    }

    // Registrar la transacción procesada en el historial
    await this.historyProvider.saveTransaction(transaction);

    return {
      transactionId: transaction.transactionId,
      accountId: transaction.accountId,
      totalScore,
      threshold,
      isFraud,
      caseId,
      ruleEvaluations,
      explanations,
    };
  }

  private getThreshold(): number {
    const configuredValue = this.configuration.get("SCORE_THRESHOLD");
    if (typeof configuredValue === "number" && configuredValue > 0) {
      return configuredValue;
    }
    return 60; // Umbral configurable por defecto (ADR / Sprint 2)
  }
}
