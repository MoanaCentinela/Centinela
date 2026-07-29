import { RuleEngine } from "../engine/RuleEngine.js";
export class ScoringEngine {
    ruleEngine;
    historyProvider;
    caseRepository;
    casePublisher;
    configuration;
    constructor(dependencies) {
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
    async evaluateTransaction(transaction) {
        const recentTransactions = await this.historyProvider.getRecentTransactions(transaction.accountId);
        const accountHistoricalAverage = await this.historyProvider.getAccountHistoricalAverage(transaction.accountId);
        const context = {
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
        let caseId;
        if (isFraud) {
            caseId = `CASE-${Date.now()}-${transaction.transactionId.substring(0, 8)}`;
            const fraudCase = {
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
    getThreshold() {
        const configuredValue = this.configuration.get("SCORE_THRESHOLD");
        if (typeof configuredValue === "number" && configuredValue > 0) {
            return configuredValue;
        }
        return 60; // Umbral configurable por defecto (ADR / Sprint 2)
    }
}
