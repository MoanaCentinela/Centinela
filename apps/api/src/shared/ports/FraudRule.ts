import { TransactionRequest } from "../contracts/index.js";

export interface RuleContext {
  recentTransactions: TransactionRequest[];
  accountHistoricalAverage?: number;
  riskMerchants?: string[];
  riskCategories?: string[];
}

export interface FraudRuleResult {
  ruleName: string;
  triggered: boolean;
  points: number;
  explanation: string;
  observedValue?: number | string;
  threshold?: number | string;
}

export interface FraudRule {
  readonly name: string;
  evaluate(transaction: TransactionRequest, context: RuleContext): Promise<FraudRuleResult> | FraudRuleResult;
}
