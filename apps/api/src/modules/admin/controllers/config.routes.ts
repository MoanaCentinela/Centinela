import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { MemoryRuntimeConfig } from "../../../infrastructure/config/MemoryRuntimeConfig.js";
import { ApiResponse } from "../../../responses/index.js";
import { createAuthenticateHook } from "../../auth/middleware/authenticate.js";
import { authorize } from "../../auth/middleware/authorize.js";
import { TokenService } from "../../auth/services/TokenService.js";

interface UpdateThresholdBody {
  threshold: number;
}

export async function configRoutes(
  app: FastifyInstance,
  options: { runtimeConfig: MemoryRuntimeConfig; tokenService: TokenService }
) {
  const { runtimeConfig } = options;
  const authenticate = createAuthenticateHook(options.tokenService);
  const onlyAdmin = authorize("ADMIN");

  // GET /admin/config/threshold - Consultar el umbral de scoring vigente (Analista, Administrador, Auditor)
  app.get("/admin/config/threshold", { preHandler: authenticate }, async (request: FastifyRequest, reply: FastifyReply) => {
    return reply.status(200).send(ApiResponse.success("Umbral obtenido correctamente.", { threshold: runtimeConfig.getThreshold() }));
  });

  // PUT /admin/config/threshold - Actualizar el umbral de scoring sin redespliegue (solo Administrador)
  app.put<{ Body: UpdateThresholdBody }>(
    "/admin/config/threshold",
    { preHandler: [authenticate, onlyAdmin] },
    async (request, reply) => {
      const { threshold } = request.body ?? ({} as UpdateThresholdBody);

      if (typeof threshold !== "number" || !Number.isFinite(threshold) || threshold <= 0) {
        return reply.status(400).send(ApiResponse.error("El umbral debe ser un número mayor que cero."));
      }

      runtimeConfig.setThreshold(threshold);
      return reply.status(200).send(ApiResponse.success("Umbral actualizado correctamente.", { threshold: runtimeConfig.getThreshold() }));
    }
  );
}
