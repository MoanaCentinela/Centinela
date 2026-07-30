import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { ApiRequestError } from "../api/client";

const DEMO_ACCOUNTS = [
  { label: "Administrador", username: "admin", password: "Admin123!" },
  { label: "Analista", username: "analista", password: "Analista123!" },
  { label: "Auditor", username: "auditor", password: "Auditor123!" },
];

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    const redirectTo = (location.state as { from?: string } | null)?.from ?? "/cases";
    return <Navigate to={redirectTo} replace />;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(username, password);
      navigate("/cases", { replace: true });
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "No se pudo iniciar sesión.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>Centinela</h1>
        <p className="page__subtitle">Portal de Analistas de Fraude</p>

        <label className="field">
          <span>Usuario</span>
          <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required />
        </label>

        <label className="field">
          <span>Contraseña</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        {error && <p className="error-text">{error}</p>}

        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? "Ingresando..." : "Ingresar"}
        </button>

        <div className="login-demo">
          <span className="login-demo__label">Cuentas de prueba</span>
          <div className="login-demo__buttons">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.username}
                type="button"
                className="btn btn--ghost btn--small"
                onClick={() => {
                  setUsername(account.username);
                  setPassword(account.password);
                }}
              >
                {account.label}
              </button>
            ))}
          </div>
        </div>
      </form>
    </div>
  );
}
