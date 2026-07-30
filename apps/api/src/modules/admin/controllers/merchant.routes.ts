import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { RiskMerchantRepository } from "../../../shared/ports/RiskMerchantRepository.js";
import { ApiResponse } from "../../../responses/index.js";
import { createAuthenticateHook } from "../../auth/middleware/authenticate.js";
import { authorize } from "../../auth/middleware/authorize.js";
import { TokenService } from "../../auth/services/TokenService.js";

interface MerchantBody {
  merchantId?: string;
  category?: string;
}

export async function merchantRoutes(
  app: FastifyInstance,
  options: { repository: RiskMerchantRepository; tokenService: TokenService }
) {
  const { repository } = options;
  const authenticate = createAuthenticateHook(options.tokenService);
  const onlyAdmin = authorize("ADMIN");

  // GET /admin/merchants - Listar comercios y categorías marcadas como de riesgo (Analista, Administrador, Auditor)
  app.get("/admin/merchants", { preHandler: authenticate }, async (request: FastifyRequest, reply: FastifyReply) => {
    const [riskMerchants, riskCategories] = await Promise.all([
      repository.getRiskMerchants(),
      repository.getRiskCategories(),
    ]);
    return reply.status(200).send(ApiResponse.success("Comercios de riesgo obtenidos correctamente.", { riskMerchants, riskCategories }));
  });

  // POST /admin/merchants - Marcar un comercio o categoría como de riesgo (solo Administrador)
  app.post<{ Body: MerchantBody }>(
    "/admin/merchants",
    { preHandler: [authenticate, onlyAdmin] },
    async (request, reply) => {
      const { merchantId, category } = request.body ?? ({} as MerchantBody);

      if (!merchantId && !category) {
        return reply.status(400).send(ApiResponse.error("Debe indicar 'merchantId' o 'category'."));
      }

      if (merchantId) {
        await repository.addRiskMerchant(merchantId);
      }
      if (category) {
        await repository.addRiskCategory(category);
      }

      const [riskMerchants, riskCategories] = await Promise.all([
        repository.getRiskMerchants(),
        repository.getRiskCategories(),
      ]);

      return reply.status(201).send(ApiResponse.success("Comercio de riesgo agregado correctamente.", { riskMerchants, riskCategories }));
    }
  );

  // DELETE /admin/merchants - Retirar un comercio o categoría de la lista de riesgo (solo Administrador)
  app.delete<{ Body: MerchantBody }>(
    "/admin/merchants",
    { preHandler: [authenticate, onlyAdmin] },
    async (request, reply) => {
      const { merchantId, category } = request.body ?? ({} as MerchantBody);

      if (!merchantId && !category) {
        return reply.status(400).send(ApiResponse.error("Debe indicar 'merchantId' o 'category'."));
      }

      if (merchantId) {
        await repository.removeRiskMerchant(merchantId);
      }
      if (category) {
        await repository.removeRiskCategory(category);
      }

      const [riskMerchants, riskCategories] = await Promise.all([
        repository.getRiskMerchants(),
        repository.getRiskCategories(),
      ]);

      return reply.status(200).send(ApiResponse.success("Comercio de riesgo retirado correctamente.", { riskMerchants, riskCategories }));
    }
  );
}
