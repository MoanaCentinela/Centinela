import { FastifyReply, FastifyRequest } from "fastify";
import { TokenService, TokenPayload } from "../services/TokenService.js";
import { ApiResponse } from "../../../responses/index.js";

declare module "fastify" {
  interface FastifyRequest {
    user?: TokenPayload;
  }
}

export function createAuthenticateHook(tokenService: TokenService) {
  return async function authenticate(request: FastifyRequest, reply: FastifyReply) {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return reply.status(401).send(ApiResponse.error("Se requiere autenticación."));
    }

    const token = authHeader.substring("Bearer ".length);
    const payload = tokenService.verify(token);

    if (!payload) {
      return reply.status(401).send(ApiResponse.error("Token inválido o expirado."));
    }

    request.user = payload;
  };
}
