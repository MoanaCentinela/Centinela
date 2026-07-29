import { TransactionHistoryProvider } from "../../shared/ports/TransactionHistoryProvider.js";
import { TransactionRequest } from "../../shared/contracts/index.js";

export class MemoryTransactionHistoryProvider implements TransactionHistoryProvider {
  private readonly store: Map<string, TransactionRequest[]> = new Map();

  async saveTransaction(transaction: TransactionRequest): Promise<void> {
    const accountId = transaction.accountId;
    const list = this.store.get(accountId) ?? [];
    list.push(transaction);
    this.store.set(accountId, list);
  }

  async getRecentTransactions(accountId: string, timeframeMinutes: number = 30): Promise<TransactionRequest[]> {
    const list = this.store.get(accountId) ?? [];
    const now = Date.now();
    const timeframeMs = timeframeMinutes * 60 * 1000;

    return list.filter((trx) => {
      const trxTime = new Date(trx.clientTimestamp).getTime();
      return now - trxTime <= timeframeMs;
    });
  }

  async getAccountHistoricalAverage(accountId: string): Promise<number> {
    const list = this.store.get(accountId) ?? [];
    if (list.length === 0) return 0;

    const total = list.reduce((sum, trx) => sum + trx.amount, 0);
    return Math.round(total / list.length);
  }
}
