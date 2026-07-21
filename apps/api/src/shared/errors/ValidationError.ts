export class ValidationError extends Error {
  constructor(public readonly errors: string[]) {
    super("La transacción contiene errores de validación.");

    this.name = "ValidationError";
  }
}