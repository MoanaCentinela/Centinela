import { CaseRepository } from "../../shared/ports/CaseRepository.js";
import { FraudCase } from "../../shared/models/FraudCase.js";

export class MemoryCaseRepository implements CaseRepository {
  private readonly cases: Map<string, FraudCase> = new Map();

  async saveCase(fraudCase: FraudCase): Promise<void> {
    this.cases.set(fraudCase.id, fraudCase);
  }

  async findCaseById(id: string): Promise<FraudCase | null> {
    return this.cases.get(id) ?? null;
  }

  async findCaseByTransactionId(transactionId: string): Promise<FraudCase | null> {
    for (const c of this.cases.values()) {
      if (c.transactionId === transactionId) {
        return c;
      }
    }
    return null;
  }

  async findAllCases(): Promise<FraudCase[]> {
    return Array.from(this.cases.values());
  }
}
