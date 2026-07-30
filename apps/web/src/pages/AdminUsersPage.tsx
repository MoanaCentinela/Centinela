import { useEffect, useState } from "react";
import { createUser, deleteUser, listUsers } from "../api/client";
import type { PublicUser, UserRole } from "../api/types";
import { useAuth } from "../auth/AuthContext";

const ROLES: UserRole[] = ["ANALYST", "ADMIN", "AUDITOR"];

export function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const canEdit = currentUser?.role === "ADMIN";
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("ANALYST");
  const [creating, setCreating] = useState(false);

  function load() {
    setLoading(true);
    listUsers()
      .then(setUsers)
      .catch((err) => setError(err instanceof Error ? err.message : "No se pudieron cargar los usuarios."))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setCreating(true);
    setError(null);
    try {
      const created = await createUser(username, password, role);
      setUsers((prev) => [...prev, created]);
      setUsername("");
      setPassword("");
      setRole("ANALYST");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el usuario.");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar el usuario.");
    }
  }

  return (
    <div className="page">
      <header className="page__header">
        <h1>Usuarios</h1>
        <p className="page__subtitle">Analista, Administrador y Auditor de solo lectura.</p>
      </header>

      {error && <p className="error-text">{error}</p>}
      {loading && <p className="state-text">Cargando usuarios...</p>}

      {!loading && (
        <>
          <table className="table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Creado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.username}</td>
                  <td>{u.role}</td>
                  <td>{new Date(u.createdAt).toLocaleString("es-CO")}</td>
                  <td>
                    {canEdit && u.id !== currentUser?.id && (
                      <button type="button" className="btn btn--ghost btn--small" onClick={() => handleDelete(u.id)}>
                        Eliminar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {canEdit && (
            <form className="card" onSubmit={handleCreate}>
              <h2>Crear usuario</h2>

              <label className="field">
                <span>Usuario</span>
                <input value={username} onChange={(e) => setUsername(e.target.value)} required />
              </label>

              <label className="field">
                <span>Contraseña</span>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </label>

              <label className="field">
                <span>Rol</span>
                <select value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </label>

              <button type="submit" className="btn btn--primary" disabled={creating}>
                {creating ? "Creando..." : "Crear usuario"}
              </button>
            </form>
          )}

          {!canEdit && <p className="state-text">Su rol tiene acceso de solo lectura a esta sección.</p>}
        </>
      )}
    </div>
  );
}
