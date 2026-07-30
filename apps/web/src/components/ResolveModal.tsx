import { useState } from "react";
import type { ResolveDecision } from "../api/types";

interface ResolveModalProps {
  onClose: () => void;
  onSubmit: (decision: ResolveDecision, notes: string) => Promise<void>;
}

export function ResolveModal({ onClose, onSubmit }: ResolveModalProps) {
  const [decision, setDecision] = useState<ResolveDecision | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!decision) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(decision, notes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo resolver el caso.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Resolver caso</h2>

        <div className="modal__decisions">
          <button
            type="button"
            className={`decision-btn decision-btn--fraud ${decision === "CONFIRMED_FRAUD" ? "is-selected" : ""}`}
            onClick={() => setDecision("CONFIRMED_FRAUD")}
          >
            Confirmar Fraude
          </button>
          <button
            type="button"
            className={`decision-btn decision-btn--false-positive ${decision === "DISCARDED_FALSE_POSITIVE" ? "is-selected" : ""}`}
            onClick={() => setDecision("DISCARDED_FALSE_POSITIVE")}
          >
            Falso Positivo
          </button>
        </div>

        <label className="field">
          <span>Notas</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Describe el motivo de la decisión..."
          />
        </label>

        {error && <p className="error-text">{error}</p>}

        <div className="modal__actions">
          <button type="button" className="btn btn--ghost" onClick={onClose} disabled={submitting}>
            Cancelar
          </button>
          <button type="button" className="btn btn--primary" onClick={handleSubmit} disabled={!decision || submitting}>
            {submitting ? "Enviando..." : "Confirmar decisión"}
          </button>
        </div>
      </div>
    </div>
  );
}
