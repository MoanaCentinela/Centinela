import { useEffect, useState } from "react";
import { getThreshold, updateThreshold } from "../api/client";
import { useAuth } from "../auth/AuthContext";

export function AdminThresholdPage() {
  const { user } = useAuth();
  const canEdit = user?.role === "ADMIN";
  const [threshold, setThreshold] = useState<number | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    getThreshold()
      .then(({ threshold }) => {
        setThreshold(threshold);
        setInputValue(String(threshold));
      })
      .catch((err) => setError(err instanceof Error ? err.message : "No se pudo cargar el umbral."))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = Number(inputValue);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError("El umbral debe ser un número mayor que cero.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await updateThreshold(parsed);
      setThreshold(result.threshold);
      setSuccess("Umbral actualizado correctamente. Se aplica de inmediato, sin redespliegue.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar el umbral.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <header className="page__header">
        <h1>Umbral de Scoring</h1>
        <p className="page__subtitle">Un score igual o superior a este valor abre un caso de fraude.</p>
      </header>

      {loading && <p className="state-text">Cargando umbral...</p>}

      {!loading && (
        <form className="card" onSubmit={handleSubmit}>
          <div className="detail-field" style={{ marginBottom: 16 }}>
            <span className="detail-field__label">Umbral vigente</span>
            <span>{threshold}</span>
          </div>

          {canEdit && (
            <>
              <label className="field">
                <span>Nuevo umbral</span>
                <input
                  type="number"
                  min={1}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
              </label>

              {error && <p className="error-text">{error}</p>}
              {success && <p className="state-text">{success}</p>}

              <button type="submit" className="btn btn--primary" disabled={saving}>
                {saving ? "Guardando..." : "Guardar umbral"}
              </button>
            </>
          )}

          {!canEdit && <p className="state-text">Su rol tiene acceso de solo lectura a esta sección.</p>}
        </form>
      )}
    </div>
  );
}
