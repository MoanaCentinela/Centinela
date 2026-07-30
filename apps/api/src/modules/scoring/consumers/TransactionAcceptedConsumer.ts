import { TransactionAcceptedEvent } from "../../../shared/contracts/events/TransactionAcceptedEvent.js";
import { ScoringEngine, ScoringResult } from "../services/ScoringEngine.js";
import { MemoryTransactionRepository } from "../../ingestion/repositories/MemoryTransactionRepository.js";

export class TransactionAcceptedConsumer {
  constructor(
    private readonly scoringEngine: ScoringEngine,
    private readonly repository: MemoryTransactionRepository
  ) {}

  async handle(event: TransactionAcceptedEvent): Promise<ScoringResult | null> {
    const transaction = await this.repository.findById(event.transactionId);
    if (!transaction) {
      return null;
    }

    return await this.scoringEngine.evaluateTransaction(transaction);
  }
}
