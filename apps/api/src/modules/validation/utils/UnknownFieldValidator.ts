const allowedFields = [
  "transactionId",
  "accountId",
  "amount",
  "currency",
  "clientTimestamp",
  "location",
  "merchant",
];

export function validateUnknownFields(
  payload: Record<string, unknown>
): string[] {
  const errors: string[] = [];

  for (const key of Object.keys(payload)) {
    if (!allowedFields.includes(key)) {
      errors.push(`El campo '${key}' no está permitido.`);
    }
  }

  return errors;
}