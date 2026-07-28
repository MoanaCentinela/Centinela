import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { TransactionRequest } from "../../../shared/contracts/index.js";
import { ApiResponse } from "../../../responses/index.js";
import { TransactionService } from "../services/TransactionService.js";

export async function transactionRoutes(app: FastifyInstance, options: { service: TransactionService }) {
  const transactionService = options.service;

  app.post("/transactions", async (request: FastifyRequest, reply: FastifyReply) => {
    const transaction = request.body as TransactionRequest;

    const result = await transactionService.processTransaction(transaction);

    if (!result.success) {
      return reply
        .status(400)
        .send(ApiResponse.error(result.message, result.errors));
    }

    if (result.duplicate) {
      return reply
        .status(200)
        .send(ApiResponse.success(result.message));
    }

    return reply
      .status(202)
      .send(ApiResponse.success(result.message));
  });
}