import { z } from "zod";
import { TransactionSchema } from "./transaction.schema.js";

export type TransactionRequest = z.infer<typeof TransactionSchema>;