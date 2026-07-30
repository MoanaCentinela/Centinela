import { UserRepository } from "../../../shared/ports/UserRepository.js";
import { PasswordHasher } from "./PasswordHasher.js";
import { TokenService } from "./TokenService.js";
import { PublicUser, toPublicUser } from "../../../shared/models/User.js";

export interface LoginResult {
  token: string;
  user: PublicUser;
}

export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenService: TokenService
  ) {}

  async login(username: string, password: string): Promise<LoginResult | null> {
    const user = await this.userRepository.findByUsername(username);
    if (!user) {
      return null;
    }

    const isValid = this.passwordHasher.verify(password, user.passwordHash);
    if (!isValid) {
      return null;
    }

    const token = this.tokenService.issue({ sub: user.id, username: user.username, role: user.role });
    return { token, user: toPublicUser(user) };
  }
}
