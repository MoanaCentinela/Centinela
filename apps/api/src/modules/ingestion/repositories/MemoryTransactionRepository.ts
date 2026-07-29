import { TransactionRequest } from "../../../shared/contracts/index.js";
import { TransactionRepository } from "../../../shared/ports/TransactionRepository.js";
import { TransactionHistoryProvider } from "../../../shared/ports/TransactionHistoryProvider.js";

export class MemoryTransactionRepository implements TransactionRepository {
  private readonly transactions = new Map<string, TransactionRequest>();

  constructor(private readonly historyProvider?: TransactionHistoryProvider) {}

  async save(transaction: TransactionRequest): Promise<void> {
    this.transactions.set(transaction.transactionId, transaction);
    if (this.historyProvider) {
      await this.historyProvider.saveTransaction(transaction);
    }
  }

  async exists(transactionId: string): Promise<boolean> {
    return this.transactions.has(transactionId);
  }

  async findById(transactionId: string): Promise<TransactionRequest | null> {
    return this.transactions.get(transactionId) ?? null;
  }
}