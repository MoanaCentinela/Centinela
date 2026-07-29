import { FraudRule, FraudRuleResult, RuleContext } from "../../../shared/ports/FraudRule.js";
import { TransactionRequest } from "../../../shared/contracts/index.js";

export class VelocityRule implements FraudRule {
  readonly name = "VelocityRule";

  constructor(
    private readonly thresholdCount: number = 3,
    private readonly points: number = 35
  ) {}

  evaluate(transaction: TransactionRequest, context: RuleContext): FraudRuleResult {
    const count = context.recentTransactions.length + 1; // Incluyendo la transacción actual

    if (count >= this.thresholdCount) {
      return {
        ruleName: this.name,
        triggered: true,
        points: this.points,
        explanation: `Se detectaron ${count} transacciones de esta cuenta en los últimos minutos (+${this.points} puntos).`,
        observedValue: count,
        threshold: this.thresholdCount,
      };
    }

    return {
      ruleName: this.name,
      triggered: false,
      points: 0,
      explanation: `Frecuencia transaccional normal (${count} transacciones en la ventana evaluada).`,
      observedValue: count,
      threshold: this.thresholdCount,
    };
  }
}
