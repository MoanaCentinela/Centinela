import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { listCases } from "../api/client";
import type { CaseStatus, FraudCase } from "../api/types";
import { StatusBadge } from "../components/StatusBadge";
import { ScoreIndicator } from "../components/ScoreIndicator";

type Filter = "ALL" | CaseStatus;

export function CasesListPage() {
  const [cases, setCases] = useState<FraudCase[]>([]);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listCases()
      .then(setCases)
      .catch((err) => setError(err instanceof Error ? err.message : "No se pudieron cargar los casos."))
      .finally(() => setLoading(false));
  }, []);

  const filteredCases = useMemo(() => {
    if (filter === "ALL") return cases;
    return cases.filter((c) => c.status === filter);
  }, [cases, filter]);

  return (
    <div className="page">
      <header className="page__header">
        <h1>Casos de Fraude</h1>
        <p className="page__subtitle">Portal de Analistas — Centinela</p>
      </header>

      <div className="filters">
        <button className={filter === "ALL" ? "filter-btn is-active" : "filter-btn"} onClick={() => setFilter("ALL")}>
          Todos
        </button>
        <button className={filter === "OPEN" ? "filter-btn is-active" : "filter-btn"} onClick={() => setFilter("OPEN")}>
          Abiertos
        </button>
        <button
          className={filter === "RESOLVED" ? "filter-btn is-active" : "filter-btn"}
          onClick={() => setFilter("RESOLVED")}
        >
          Resueltos
        </button>
      </div>

      {loading && <p className="state-text">Cargando casos...</p>}
      {error && <p className="error-text">{error}</p>}

      {!loading && !error && filteredCases.length === 0 && <p className="state-text">No hay casos para mostrar.</p>}

      {!loading && !error && filteredCases.length > 0 && (
        <table className="table">
          <thead>
            <tr>
              <th>ID Caso</th>
              <th>Cuenta</th>
              <th>Score</th>
              <th>Estado</th>
              <th>Creado</th>
            </tr>
          </thead>
          <tbody>
            {filteredCases.map((c) => (
              <tr key={c.id}>
                <td>
                  <Link to={`/cases/${c.id}`} className="table-link">
                    {c.id}
                  </Link>
                </td>
                <td>{c.accountId}</td>
                <td>
                  <ScoreIndicator score={c.score} threshold={c.threshold} />
                </td>
                <td>
                  <StatusBadge status={c.status} />
                </td>
                <td>{new Date(c.createdAt).toLocaleString("es-CO")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
