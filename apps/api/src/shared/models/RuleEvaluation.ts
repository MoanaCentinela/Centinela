export interface RuleEvaluation {
  ruleName: string;
  observedValue: number;
  threshold: number;
  explanation: string;
  result: "passed" | "failed";
  timestamp: string;
}
