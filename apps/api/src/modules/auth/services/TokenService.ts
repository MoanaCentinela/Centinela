import { createHmac, timingSafeEqual } from "node:crypto";
import { UserRole } from "../../../shared/models/User.js";

export interface TokenPayload {
  sub: string;
  username: string;
  role: UserRole;
  iat: number;
  exp: number;
}

const TOKEN_TTL_SECONDS = 60 * 60 * 8; // 8 horas de sesión

function base64UrlEncode(input: string): string {
  return Buffer.from(input, "utf8").toString("base64url");
}

function base64UrlDecode(input: string): string {
  return Buffer.from(input, "base64url").toString("utf8");
}

export class TokenService {
  constructor(private readonly secret: string) {}

  issue(payload: Pick<TokenPayload, "sub" | "username" | "role">): string {
    const now = Math.floor(Date.now() / 1000);
    const fullPayload: TokenPayload = {
      ...payload,
      iat: now,
      exp: now + TOKEN_TTL_SECONDS,
    };

    const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
    const signature = this.sign(encodedPayload);
    return `${encodedPayload}.${signature}`;
  }

  verify(token: string): TokenPayload | null {
    const [encodedPayload, signature] = token.split(".");
    if (!encodedPayload || !signature) {
      return null;
    }

    const expectedSignature = this.sign(encodedPayload);
    const signatureBuffer = Buffer.from(signature, "utf8");
    const expectedBuffer = Buffer.from(expectedSignature, "utf8");

    if (signatureBuffer.length !== expectedBuffer.length || !timingSafeEqual(signatureBuffer, expectedBuffer)) {
      return null;
    }

    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as TokenPayload;

    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  }

  private sign(encodedPayload: string): string {
    return createHmac("sha256", this.secret).update(encodedPayload).digest("base64url");
  }
}
