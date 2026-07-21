export class DuplicateTransactionError extends Error {
  constructor(transactionId: string) {
    super(`La transacción ${transactionId} ya fue recibida.`);

    this.name = "DuplicateTransactionError";
  }
}