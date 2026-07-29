import { FraudRule, FraudRuleResult, RuleContext } from "../../../shared/ports/FraudRule.js";
import { TransactionRequest } from "../../../shared/contracts/index.js";

export class RuleEngine {
  private readonly rules: FraudRule[] = [];

  constructor(initialRules: FraudRule[] = []) {
    initialRules.forEach((rule) => this.registerRule(rule));
  }

  registerRule(rule: FraudRule): void {
    this.rules.push(rule);
  }

  getRules(): readonly FraudRule[] {
    return this.rules;
  }

  async executeAll(transaction: TransactionRequest, context: RuleContext): Promise<FraudRuleResult[]> {
    const results: FraudRuleResult[] = [];

    for (const rule of this.rules) {
      const result = await rule.evaluate(transaction, context);
      results.push(result);
    }

    return results;
  }
}
