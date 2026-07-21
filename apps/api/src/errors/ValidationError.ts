import { ApiError } from "./ApiError.js";

export class ValidationError extends ApiError {
  constructor(public readonly errors: string[]) {
    super(400, "La transacción contiene errores de validación.");
  }
}