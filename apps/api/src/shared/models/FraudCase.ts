import { FraudRuleResult } from "../ports/FraudRule.js";

export type CaseStatus = "OPEN" | "IN_REVIEW" | "RESOLVED";

export interface CaseResolution {
  decision: "CONFIRMED_FRAUD" | "DISCARDED_FALSE_POSITIVE";
  notes?: string;
  analystId?: string;
  resolvedAt: string;
}

export interface VerificationDocument {
  id: string;
  filename: string;
  documentType?: string;
  extractedData?: Record<string, any>;
  uploadedAt: string;
}

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
  resolution?: CaseResolution;
  documents?: VerificationDocument[];
}
