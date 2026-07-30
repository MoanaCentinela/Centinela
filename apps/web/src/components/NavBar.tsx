import { NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export function NavBar() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <nav className="navbar">
      <div className="navbar__brand">Centinela</div>

      <div className="navbar__links">
        <NavLink to="/cases" className={({ isActive }) => (isActive ? "navbar__link is-active" : "navbar__link")}>
          Casos
        </NavLink>

        {(user.role === "ADMIN" || user.role === "AUDITOR") && (
          <>
            <NavLink to="/admin/threshold" className={({ isActive }) => (isActive ? "navbar__link is-active" : "navbar__link")}>
              Umbral
            </NavLink>
            <NavLink to="/admin/merchants" className={({ isActive }) => (isActive ? "navbar__link is-active" : "navbar__link")}>
              Comercios de riesgo
            </NavLink>
            <NavLink to="/admin/users" className={({ isActive }) => (isActive ? "navbar__link is-active" : "navbar__link")}>
              Usuarios
            </NavLink>
          </>
        )}
      </div>

      <div className="navbar__session">
        <span className="navbar__user">
          {user.username} <span className="navbar__role">({roleLabel(user.role)})</span>
        </span>
        <button type="button" className="btn btn--ghost btn--small" onClick={logout}>
          Cerrar sesión
        </button>
      </div>
    </nav>
  );
}

function roleLabel(role: string): string {
  switch (role) {
    case "ADMIN":
      return "Administrador";
    case "ANALYST":
      return "Analista";
    case "AUDITOR":
      return "Auditor";
    default:
      return role;
  }
}
