import { TransactionRequest } from "../../../shared/contracts/index.js";
import { TransactionRepository } from "../../../shared/ports/TransactionRepository.js";

export class MemoryTransactionRepository
  implements TransactionRepository
{
  private readonly transactions = new Map<string, TransactionRequest>();

  async save(transaction: TransactionRequest): Promise<void> {
    this.transactions.set(transaction.transactionId, transaction);
  }

  async exists(transactionId: string): Promise<boolean> {
    return this.transactions.has(transactionId);
  }
}