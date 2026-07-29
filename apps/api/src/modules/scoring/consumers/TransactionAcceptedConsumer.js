export class TransactionAcceptedConsumer {
    scoringEngine;
    repository;
    constructor(scoringEngine, repository) {
        this.scoringEngine = scoringEngine;
        this.repository = repository;
    }
    async handle(event) {
        const transaction = await this.repository.findById(event.transactionId);
        if (!transaction) {
            return null;
        }
        return await this.scoringEngine.evaluateTransaction(transaction);
    }
}
