import { FraudRule, FraudRuleResult, RuleContext } from "../../../shared/ports/FraudRule.js";
import { TransactionRequest } from "../../../shared/contracts/index.js";

export class AmountRule implements FraudRule {
  readonly name = "AmountRule";

  constructor(
    private readonly multiplierThreshold: number = 5,
    private readonly points: number = 30
  ) {}

  evaluate(transaction: TransactionRequest, context: RuleContext): FraudRuleResult {
    const historicalAverage = context.accountHistoricalAverage ?? 0;

    if (historicalAverage > 0) {
      const multiplier = transaction.amount / historicalAverage;

      if (multiplier >= this.multiplierThreshold) {
        return {
          ruleName: this.name,
          triggered: true,
          points: this.points,
          explanation: `El monto de $${transaction.amount.toLocaleString()} supera en ${multiplier.toFixed(1)}x el promedio histórico de la cuenta ($${historicalAverage.toLocaleString()}) (+${this.points} puntos).`,
          observedValue: transaction.amount,
          threshold: historicalAverage * this.multiplierThreshold,
        };
      }
    }

    return {
      ruleName: this.name,
      triggered: false,
      points: 0,
      explanation: "El monto transaccionado se encuentra dentro del rango histórico de la cuenta.",
      observedValue: transaction.amount,
      threshold: historicalAverage * this.multiplierThreshold,
    };
  }
}
