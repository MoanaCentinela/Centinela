import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { UserRepository } from "../../../shared/ports/UserRepository.js";
import { UserRole, toPublicUser } from "../../../shared/models/User.js";
import { PasswordHasher } from "../../auth/services/PasswordHasher.js";
import { ApiResponse } from "../../../responses/index.js";
import { createAuthenticateHook } from "../../auth/middleware/authenticate.js";
import { authorize } from "../../auth/middleware/authorize.js";
import { TokenService } from "../../auth/services/TokenService.js";

const VALID_ROLES: UserRole[] = ["ANALYST", "ADMIN", "AUDITOR"];

interface CreateUserBody {
  username?: string;
  password?: string;
  role?: UserRole;
}

export async function userRoutes(
  app: FastifyInstance,
  options: { repository: UserRepository; passwordHasher: PasswordHasher; tokenService: TokenService }
) {
  const { repository, passwordHasher } = options;
  const authenticate = createAuthenticateHook(options.tokenService);
  const onlyAdmin = authorize("ADMIN");
  const canRead = authorize("ADMIN", "AUDITOR");

  // GET /admin/users - Listar usuarios del sistema (Administrador y Auditor de solo lectura)
  app.get("/admin/users", { preHandler: [authenticate, canRead] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const users = await repository.findAll();
    return reply.status(200).send(ApiResponse.success("Usuarios obtenidos correctamente.", users.map(toPublicUser)));
  });

  // POST /admin/users - Crear un usuario (Analista, Administrador o Auditor). Solo Administrador.
  app.post<{ Body: CreateUserBody }>(
    "/admin/users",
    { preHandler: [authenticate, onlyAdmin] },
    async (request, reply) => {
      const { username, password, role } = request.body ?? ({} as CreateUserBody);

      if (!username || !password || !role || !VALID_ROLES.includes(role)) {
        return reply
          .status(400)
          .send(ApiResponse.error("Se requieren 'username', 'password' y 'role' ('ANALYST', 'ADMIN' o 'AUDITOR')."));
      }

      const existing = await repository.findByUsername(username);
      if (existing) {
        return reply.status(409).send(ApiResponse.error(`Ya existe un usuario con el nombre '${username}'.`));
      }

      const user = {
        id: `USER-${Date.now()}`,
        username,
        role,
        passwordHash: passwordHasher.hash(password),
        createdAt: new Date().toISOString(),
      };

      await repository.save(user);
      return reply.status(201).send(ApiResponse.success("Usuario creado correctamente.", toPublicUser(user)));
    }
  );

  // DELETE /admin/users/:id - Eliminar un usuario (solo Administrador)
  app.delete<{ Params: { id: string } }>(
    "/admin/users/:id",
    { preHandler: [authenticate, onlyAdmin] },
    async (request, reply) => {
      const { id } = request.params;

      if (id === request.user!.sub) {
        return reply.status(400).send(ApiResponse.error("No puede eliminar su propio usuario."));
      }

      const deleted = await repository.deleteById(id);
      if (!deleted) {
        return reply.status(404).send(ApiResponse.error(`No se encontró el usuario con ID ${id}`));
      }

      return reply.status(200).send(ApiResponse.success("Usuario eliminado correctamente."));
    }
  );
}
