import { TransactionRequest } from "../contracts/index.js";

export interface TransactionHistoryProvider {
  getRecentTransactions(accountId: string, timeframeMinutes?: number): Promise<TransactionRequest[]>;
  getAccountHistoricalAverage(accountId: string): Promise<number>;
  saveTransaction(transaction: TransactionRequest): Promise<void>;
}
