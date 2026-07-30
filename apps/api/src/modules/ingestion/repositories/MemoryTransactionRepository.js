export class MemoryTransactionRepository {
    historyProvider;
    transactions = new Map();
    constructor(historyProvider) {
        this.historyProvider = historyProvider;
    }
    async save(transaction) {
        this.transactions.set(transaction.transactionId, transaction);
        if (this.historyProvider) {
            await this.historyProvider.saveTransaction(transaction);
        }
    }
    async exists(transactionId) {
        return this.transactions.has(transactionId);
    }
    async findById(transactionId) {
        return this.transactions.get(transactionId) ?? null;
    }
}
