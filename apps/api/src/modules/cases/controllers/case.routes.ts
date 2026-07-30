import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { CaseService, ResolveCaseDTO, AttachDocumentDTO } from "../services/CaseService.js";
import { ApiResponse } from "../../../responses/index.js";
import { createAuthenticateHook } from "../../auth/middleware/authenticate.js";
import { authorize } from "../../auth/middleware/authorize.js";
import { TokenService } from "../../auth/services/TokenService.js";

export async function caseRoutes(app: FastifyInstance, options: { service: CaseService; tokenService: TokenService }) {
  const caseService = options.service;
  const authenticate = createAuthenticateHook(options.tokenService);
  const canWrite = authorize("ANALYST", "ADMIN");

  // GET /cases - Listar todos los casos de fraude (Analista, Administrador, Auditor)
  app.get("/cases", { preHandler: authenticate }, async (request: FastifyRequest, reply: FastifyReply) => {
    const cases = await caseService.getAllCases();
    return reply.status(200).send(ApiResponse.success("Casos de fraude obtenidos correctamente.", cases));
  });

  // GET /cases/:id - Obtener el detalle de un caso específico (Analista, Administrador, Auditor)
  app.get<{ Params: { id: string } }>("/cases/:id", { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params;
    const fraudCase = await caseService.getCaseById(id);

    if (!fraudCase) {
      return reply.status(404).send(ApiResponse.error(`No se encontró el caso con ID ${id}`));
    }

    return reply.status(200).send(ApiResponse.success("Caso de fraude obtenido correctamente.", fraudCase));
  });

  // PATCH /cases/:id/resolve - Resolver un caso (Confirmar fraude o Falso positivo). El Auditor no puede modificar.
  app.patch<{ Params: { id: string }; Body: ResolveCaseDTO }>("/cases/:id/resolve", { preHandler: [authenticate, canWrite] }, async (request, reply) => {
    const { id } = request.params;
    const body = request.body as ResolveCaseDTO;

    if (!body || !body.decision || !["CONFIRMED_FRAUD", "DISCARDED_FALSE_POSITIVE"].includes(body.decision)) {
      return reply.status(400).send(ApiResponse.error("La decisión es obligatoria y debe ser 'CONFIRMED_FRAUD' o 'DISCARDED_FALSE_POSITIVE'."));
    }

    const updatedCase = await caseService.resolveCase(id, { ...body, analystId: request.user!.username });

    if (!updatedCase) {
      return reply.status(404).send(ApiResponse.error(`No se encontró el caso con ID ${id}`));
    }

    return reply.status(200).send(ApiResponse.success("Caso resuelto correctamente.", updatedCase));
  });

  // POST /cases/:id/documents - Adjuntar un documento de verificación al expediente. El Auditor no puede modificar.
  app.post<{ Params: { id: string }; Body: AttachDocumentDTO }>("/cases/:id/documents", { preHandler: [authenticate, canWrite] }, async (request, reply) => {
    const { id } = request.params;
    const body = request.body as AttachDocumentDTO;

    if (!body || !body.filename) {
      return reply.status(400).send(ApiResponse.error("El campo 'filename' es obligatorio para adjuntar un documento."));
    }

    const updatedCase = await caseService.attachDocument(id, body);

    if (!updatedCase) {
      return reply.status(404).send(ApiResponse.error(`No se encontró el caso con ID ${id}`));
    }

    return reply.status(200).send(ApiResponse.success("Documento adjuntado correctamente al expediente.", updatedCase));
  });
}
