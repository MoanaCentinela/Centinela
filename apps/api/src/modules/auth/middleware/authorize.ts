import { FastifyReply, FastifyRequest } from "fastify";
import { UserRole } from "../../../shared/models/User.js";
import { ApiResponse } from "../../../responses/index.js";

export function authorize(...allowedRoles: UserRole[]) {
  return async function authorizeHook(request: FastifyRequest, reply: FastifyReply) {
    const role = request.user?.role;

    if (!role || !allowedRoles.includes(role)) {
      return reply.status(403).send(ApiResponse.error("No tiene permisos para realizar esta acción."));
    }
  };
}
