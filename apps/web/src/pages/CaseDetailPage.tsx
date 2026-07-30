import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { attachDocument, getCase, resolveCase } from "../api/client";
import type { FraudCaseDetail, ResolveDecision } from "../api/types";
import { StatusBadge } from "../components/StatusBadge";
import { ScoreIndicator } from "../components/ScoreIndicator";
import { ResolveModal } from "../components/ResolveModal";
import { DocumentUploadForm } from "../components/DocumentUploadForm";
import { useAuth } from "../auth/AuthContext";

export function CaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const canOperate = user?.role === "ANALYST" || user?.role === "ADMIN";
  const [fraudCase, setFraudCase] = useState<FraudCaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getCase(id)
      .then(setFraudCase)
      .catch((err) => setError(err instanceof Error ? err.message : "No se pudo cargar el caso."))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleResolve(decision: ResolveDecision, notes: string) {
    if (!id) return;
    const updated = await resolveCase(id, decision, notes);
    setFraudCase(updated);
    setShowModal(false);
  }

  async function handleAttachDocument(filename: string, documentType: string) {
    if (!id) return;
    const updated = await attachDocument(id, filename, documentType);
    setFraudCase(updated);
  }

  if (loading) return <div className="page"><p className="state-text">Cargando caso...</p></div>;
  if (error) return <div className="page"><p className="error-text">{error}</p></div>;
  if (!fraudCase) return null;

  return (
    <div className="page">
      <Link to="/cases" className="back-link">
        ← Volver a casos
      </Link>

      <header className="page__header">
        <h1>{fraudCase.id}</h1>
        <div className="page__meta">
          <StatusBadge status={fraudCase.status} />
          <ScoreIndicator score={fraudCase.score} threshold={fraudCase.threshold} />
        </div>
      </header>

      <section className="detail-grid">
        <div className="detail-field">
          <span className="detail-field__label">Transacción</span>
          <span>{fraudCase.transactionId}</span>
        </div>
        <div className="detail-field">
          <span className="detail-field__label">Cuenta</span>
          <span>{fraudCase.accountId}</span>
        </div>
        <div className="detail-field">
          <span className="detail-field__label">Creado</span>
          <span>{new Date(fraudCase.createdAt).toLocaleString("es-CO")}</span>
        </div>
      </section>

      <section className="card">
        <h2>Explicación del Riesgo</h2>
        <ul className="explanation-list">
          {fraudCase.explanations.map((explanation, i) => (
            <li key={i}>{explanation}</li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2>Reglas Disparadas</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Regla</th>
              <th>Disparada</th>
              <th>Puntos</th>
              <th>Valor observado</th>
              <th>Explicación</th>
            </tr>
          </thead>
          <tbody>
            {fraudCase.ruleEvaluations.map((rule) => (
              <tr key={rule.ruleName}>
                <td>{rule.ruleName}</td>
                <td>{rule.triggered ? "✅" : "—"}</td>
                <td>{rule.points}</td>
                <td>{rule.observedValue}</td>
                <td>{rule.explanation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card">
        <h2>Documentos de Verificación</h2>

        {fraudCase.documents && fraudCase.documents.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>Archivo</th>
                <th>Tipo</th>
                <th>Cargado</th>
              </tr>
            </thead>
            <tbody>
              {fraudCase.documents.map((doc) => (
                <tr key={doc.id}>
                  <td>{doc.filename}</td>
                  <td>{doc.documentType}</td>
                  <td>{new Date(doc.uploadedAt).toLocaleString("es-CO")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="state-text">No hay documentos adjuntos a este caso.</p>
        )}

        {canOperate && <DocumentUploadForm onSubmit={handleAttachDocument} />}
      </section>

      {canOperate && fraudCase.status === "OPEN" && (
        <button type="button" className="btn btn--primary" onClick={() => setShowModal(true)}>
          Resolver caso
        </button>
      )}

      {showModal && <ResolveModal onClose={() => setShowModal(false)} onSubmit={handleResolve} />}
    </div>
  );
}
