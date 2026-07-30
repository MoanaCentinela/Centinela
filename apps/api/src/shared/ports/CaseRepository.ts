import { FraudCase } from "../models/FraudCase.js";

export interface CaseRepository {
  saveCase(fraudCase: FraudCase): Promise<void>;
  findCaseById(id: string): Promise<FraudCase | null>;
  findCaseByTransactionId(transactionId: string): Promise<FraudCase | null>;
  findAllCases(): Promise<FraudCase[]>;
}
