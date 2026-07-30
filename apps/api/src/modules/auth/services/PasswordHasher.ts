import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 64;

export class PasswordHasher {
  hash(plainPassword: string): string {
    const salt = randomBytes(16).toString("hex");
    const derivedKey = scryptSync(plainPassword, salt, KEY_LENGTH).toString("hex");
    return `${salt}:${derivedKey}`;
  }

  verify(plainPassword: string, storedHash: string): boolean {
    const [salt, derivedKeyHex] = storedHash.split(":");
    if (!salt || !derivedKeyHex) {
      return false;
    }

    const derivedKey = scryptSync(plainPassword, salt, KEY_LENGTH);
    const storedKey = Buffer.from(derivedKeyHex, "hex");

    if (derivedKey.length !== storedKey.length) {
      return false;
    }

    return timingSafeEqual(derivedKey, storedKey);
  }
}
