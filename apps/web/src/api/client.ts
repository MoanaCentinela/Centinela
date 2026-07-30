import type {
  ApiResponse,
  FraudCase,
  FraudCaseDetail,
  LoginResult,
  PublicUser,
  ResolveDecision,
  RiskMerchantsConfig,
  UserRole,
} from "./types";

const API_URL = import.meta.env.VITE_API_URL ?? "";
const TOKEN_STORAGE_KEY = "centinela.token";

class ApiRequestError extends Error {
  errors: string[];
  status: number;

  constructor(message: string, errors: string[], status: number) {
    super(message);
    this.errors = errors;
    this.status = status;
  }
}

function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

function setStoredToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { ...headers, ...(init?.headers as Record<string, string> | undefined) },
  });

  const body = (await response.json()) as ApiResponse<T>;

  if (!body.success) {
    if (response.status === 401) {
      setStoredToken(null);
    }
    throw new ApiRequestError(body.message, body.errors, response.status);
  }

  return body.data;
}

// --- Autenticación ---

export function login(username: string, password: string): Promise<LoginResult> {
  return request<LoginResult>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export function getCurrentUser(): Promise<PublicUser> {
  return request<PublicUser>("/auth/me");
}

export function saveSessionToken(token: string): void {
  setStoredToken(token);
}

export function clearSessionToken(): void {
  setStoredToken(null);
}

export function hasSessionToken(): boolean {
  return getStoredToken() !== null;
}

// --- Casos de fraude ---

export function listCases(): Promise<FraudCase[]> {
  return request<FraudCase[]>("/cases");
}

export function getCase(id: string): Promise<FraudCaseDetail> {
  return request<FraudCaseDetail>(`/cases/${id}`);
}

export function resolveCase(
  id: string,
  decision: ResolveDecision,
  notes: string,
): Promise<FraudCaseDetail> {
  return request<FraudCaseDetail>(`/cases/${id}/resolve`, {
    method: "PATCH",
    body: JSON.stringify({ decision, notes }),
  });
}

export function attachDocument(
  id: string,
  filename: string,
  documentType: string,
): Promise<FraudCaseDetail> {
  return request<FraudCaseDetail>(`/cases/${id}/documents`, {
    method: "POST",
    body: JSON.stringify({ filename, documentType }),
  });
}

// --- Administración: umbral de scoring ---

export function getThreshold(): Promise<{ threshold: number }> {
  return request<{ threshold: number }>("/admin/config/threshold");
}

export function updateThreshold(threshold: number): Promise<{ threshold: number }> {
  return request<{ threshold: number }>("/admin/config/threshold", {
    method: "PUT",
    body: JSON.stringify({ threshold }),
  });
}

// --- Administración: comercios de riesgo ---

export function listRiskMerchants(): Promise<RiskMerchantsConfig> {
  return request<RiskMerchantsConfig>("/admin/merchants");
}

export function addRiskMerchant(merchantId?: string, category?: string): Promise<RiskMerchantsConfig> {
  return request<RiskMerchantsConfig>("/admin/merchants", {
    method: "POST",
    body: JSON.stringify({ merchantId, category }),
  });
}

export function removeRiskMerchant(merchantId?: string, category?: string): Promise<RiskMerchantsConfig> {
  return request<RiskMerchantsConfig>("/admin/merchants", {
    method: "DELETE",
    body: JSON.stringify({ merchantId, category }),
  });
}

// --- Administración: usuarios ---

export function listUsers(): Promise<PublicUser[]> {
  return request<PublicUser[]>("/admin/users");
}

export function createUser(username: string, password: string, role: UserRole): Promise<PublicUser> {
  return request<PublicUser>("/admin/users", {
    method: "POST",
    body: JSON.stringify({ username, password, role }),
  });
}

export function deleteUser(id: string): Promise<void> {
  return request<void>(`/admin/users/${id}`, { method: "DELETE" });
}

export { ApiRequestError };
