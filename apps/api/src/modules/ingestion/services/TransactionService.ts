import { TransactionValidator } from "../../validation/services/TransactionValidator.js";
import { MemoryTransactionRepository } from "../repositories/MemoryTransactionRepository.js";
import { TransactionRequest } from "../../../shared/contracts/index.js";

const repository = new MemoryTransactionRepository();

export class TransactionService {
  private validator = new TransactionValidator();

  async processTransaction(transaction: TransactionRequest) {
    const errors = this.validator.validate(transaction);

    if (errors.length > 0) {
      return {
        success: false,
        message: "La transacción contiene errores de validación.",
        errors,
      };
    }

    const exists = await repository.exists(transaction.transactionId);

    if (exists) {
      return {
        success: true,
        duplicate: true,
        message: `La transacción ${transaction.transactionId} ya fue recibida.`,
      };
    }

await repository.save(transaction);

/*
 * FUTURO (Semana 2)
 *
 * Aquí se publicará un evento en la cola de mensajes de Azure.
 *
 * El Motor de Scoring consumirá ese evento de forma asíncrona
 * sin afectar el tiempo de respuesta de esta API.
 */

return {
    success: true,
    duplicate: false,
    message: "Transacción recibida correctamente.",
};
  }
}