import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { AuthService } from "../services/AuthService.js";
import { ApiResponse } from "../../../responses/index.js";
import { UserRepository } from "../../../shared/ports/UserRepository.js";
import { toPublicUser } from "../../../shared/models/User.js";
import { createAuthenticateHook } from "../middleware/authenticate.js";
import { TokenService } from "../services/TokenService.js";

interface LoginBody {
  username: string;
  password: string;
}

export async function authRoutes(
  app: FastifyInstance,
  options: { service: AuthService; userRepository: UserRepository; tokenService: TokenService }
) {
  const authService = options.service;
  const authenticate = createAuthenticateHook(options.tokenService);

  app.post("/auth/login", async (request: FastifyRequest<{ Body: LoginBody }>, reply: FastifyReply) => {
    const { username, password } = request.body ?? ({} as LoginBody);

    if (!username || !password) {
      return reply.status(400).send(ApiResponse.error("El usuario y la contraseña son obligatorios."));
    }

    const result = await authService.login(username, password);

    if (!result) {
      return reply.status(401).send(ApiResponse.error("Usuario o contraseña incorrectos."));
    }

    return reply.status(200).send(ApiResponse.success("Inicio de sesión exitoso.", result));
  });

  app.get("/auth/me", { preHandler: authenticate }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = await options.userRepository.findById(request.user!.sub);

    if (!user) {
      return reply.status(404).send(ApiResponse.error("Usuario no encontrado."));
    }

    return reply.status(200).send(ApiResponse.success("Usuario actual obtenido correctamente.", toPublicUser(user)));
  });
}
