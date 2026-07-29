import { z } from "zod";
export const TransactionSchema = z
    .object({
    transactionId: z
        .string()
        .min(1, "transactionId es obligatorio"),
    accountId: z
        .string()
        .min(1, "accountId es obligatorio"),
    amount: z
        .number({
        error: "amount debe ser numérico",
    })
        .positive("amount debe ser mayor que cero")
        .max(1000000000, "amount supera el máximo permitido"),
    currency: z
        .string()
        .min(1, "currency es obligatorio"),
    clientTimestamp: z
        .string()
        .datetime("clientTimestamp debe tener formato ISO 8601"),
    location: z.object({
        latitude: z
            .number()
            .min(-90, "latitude fuera de rango")
            .max(90, "latitude fuera de rango"),
        longitude: z
            .number()
            .min(-180, "longitude fuera de rango")
            .max(180, "longitude fuera de rango"),
    }),
    merchant: z.object({
        id: z.string().min(1, "merchant.id es obligatorio"),
        category: z
            .string()
            .min(1, "merchant.category es obligatorio"),
    }),
})
    .strict();
