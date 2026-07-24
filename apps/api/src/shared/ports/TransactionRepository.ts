import { TransactionRequest } from "../../shared/contracts/index.js";

export interface TransactionRepository {
  save(transaction: TransactionRequest): Promise<void>;

  exists(transactionId: string): Promise<boolean>;
}