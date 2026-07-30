import { UserRepository } from "../../shared/ports/UserRepository.js";
import { User } from "../../shared/models/User.js";
import { PasswordHasher } from "../../modules/auth/services/PasswordHasher.js";

export class MemoryUserRepository implements UserRepository {
  private readonly users: Map<string, User> = new Map();

  constructor(passwordHasher: PasswordHasher) {
    this.seed(passwordHasher);
  }

  private seed(passwordHasher: PasswordHasher): void {
    const seedUsers: Array<Pick<User, "id" | "username" | "role"> & { password: string }> = [
      { id: "USER-ADMIN-01", username: "admin", role: "ADMIN", password: "Admin123!" },
      { id: "USER-ANALYST-01", username: "analista", role: "ANALYST", password: "Analista123!" },
      { id: "USER-AUDITOR-01", username: "auditor", role: "AUDITOR", password: "Auditor123!" },
    ];

    for (const seedUser of seedUsers) {
      const user: User = {
        id: seedUser.id,
        username: seedUser.username,
        role: seedUser.role,
        passwordHash: passwordHasher.hash(seedUser.password),
        createdAt: new Date().toISOString(),
      };
      this.users.set(user.id, user);
    }
  }

  async findByUsername(username: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.username.toLowerCase() === username.toLowerCase()) {
        return user;
      }
    }
    return null;
  }

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) ?? null;
  }

  async findAll(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async save(user: User): Promise<void> {
    this.users.set(user.id, user);
  }

  async deleteById(id: string): Promise<boolean> {
    return this.users.delete(id);
  }
}
