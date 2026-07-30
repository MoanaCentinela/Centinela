export type UserRole = "ANALYST" | "ADMIN" | "AUDITOR";

export interface PublicUser {
  id: string;
  username: string;
  role: UserRole;
  createdAt: string;
}

export interface LoginResult {
  token: string;
  user: PublicUser;
}

export interface VerificationDocument {
  id: string;
  filename: string;
  documentType?: string;
  extractedData?: Record<string, unknown>;
  uploadedAt: string;
}

export interface RiskMerchantsConfig {
  riskMerchants: string[];
  riskCategories: string[];
}

export type CaseStatus = "OPEN" | "RESOLVED";

export type ResolveDecision = "CONFIRMED_FRAUD" | "DISCARDED_FALSE_POSITIVE";

export interface FraudCase {
  id: string;
  transactionId: string;
  accountId: string;
  score: number;
  threshold: number;
  status: CaseStatus;
  createdAt: string;
  explanations: string[];
}

export interface RuleEvaluation {
  ruleName: string;
  triggered: boolean;
  points: number;
  explanation: string;
  observedValue: string;
}

export interface FraudCaseDetail extends FraudCase {
  ruleEvaluations: RuleEvaluation[];
  documents?: VerificationDocument[];
}

export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiError {
  success: false;
  message: string;
  errors: string[];
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
