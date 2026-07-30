import { FraudRule, FraudRuleResult, RuleContext } from "../../../shared/ports/FraudRule.js";
import { TransactionRequest } from "../../../shared/contracts/index.js";

export class RiskMerchantRule implements FraudRule {
  readonly name = "RiskMerchantRule";

  constructor(
    private readonly defaultRiskMerchants: string[] = ["MERCH-999", "CRYPTO-EX-01", "CASINO-VIP"],
    private readonly defaultRiskCategories: string[] = ["CASINO", "CRYPTO", "GAMBLING"],
    private readonly points: number = 40
  ) {}

  evaluate(transaction: TransactionRequest, context: RuleContext): FraudRuleResult {
    const riskMerchants = context.riskMerchants ?? this.defaultRiskMerchants;
    const riskCategories = context.riskCategories ?? this.defaultRiskCategories;

    const merchantId = transaction.merchant?.id?.toUpperCase();
    const merchantCategory = transaction.merchant?.category?.toUpperCase();

    const isRiskMerchant = merchantId && riskMerchants.includes(merchantId);
    const isRiskCategory = merchantCategory && riskCategories.includes(merchantCategory);

    if (isRiskMerchant || isRiskCategory) {
      const matchDetail = isRiskMerchant ? `comercio '${merchantId}'` : `categoría '${merchantCategory}'`;
      return {
        ruleName: this.name,
        triggered: true,
        points: this.points,
        explanation: `Transacción hacia ${matchDetail} clasificado como de alto riesgo (+${this.points} puntos).`,
        observedValue: merchantId ?? merchantCategory,
      };
    }

    return {
      ruleName: this.name,
      triggered: false,
      points: 0,
      explanation: "El comercio y la categoría transaccionada no están catalogados en riesgo.",
    };
  }
}
