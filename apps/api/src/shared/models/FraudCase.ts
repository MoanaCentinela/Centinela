import { FraudRuleResult } from "../ports/FraudRule.js";

export type CaseStatus = "OPEN" | "IN_REVIEW" | "RESOLVED";

export interface FraudCase {
  id: string;
  transactionId: string;
  accountId: string;
  score: number;
  threshold: number;
  status: CaseStatus;
  createdAt: string;
  explanations: string[];
  ruleEvaluations: FraudRuleResult[];
}
