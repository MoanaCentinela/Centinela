import {
  TransactionRequest,
  TransactionSchema,
} from "../../../shared/contracts/index.js";

export class TransactionValidator {
  validate(transaction: TransactionRequest): string[] {
    const result = TransactionSchema.safeParse(transaction);

    if (!result.success) {
      return result.error.issues.map((issue: { message: string }) => issue.message);
    }

    const errors: string[] = [];

    const timestamp = new Date(transaction.clientTimestamp);

    if (timestamp > new Date()) {
      errors.push("clientTimestamp no puede estar en el futuro");
    }

    return errors;
  }
}