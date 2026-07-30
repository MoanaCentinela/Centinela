import { useEffect, useState } from "react";
import { addRiskMerchant, listRiskMerchants, removeRiskMerchant } from "../api/client";
import type { RiskMerchantsConfig } from "../api/types";
import { useAuth } from "../auth/AuthContext";

export function AdminMerchantsPage() {
  const { user } = useAuth();
  const canEdit = user?.role === "ADMIN";
  const [config, setConfig] = useState<RiskMerchantsConfig>({ riskMerchants: [], riskCategories: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [merchantInput, setMerchantInput] = useState("");
  const [categoryInput, setCategoryInput] = useState("");

  function load() {
    setLoading(true);
    listRiskMerchants()
      .then(setConfig)
      .catch((err) => setError(err instanceof Error ? err.message : "No se pudo cargar la lista de riesgo."))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleAddMerchant(event: React.FormEvent) {
    event.preventDefault();
    if (!merchantInput.trim()) return;
    try {
      const updated = await addRiskMerchant(merchantInput.trim());
      setConfig(updated);
      setMerchantInput("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo agregar el comercio.");
    }
  }

  async function handleAddCategory(event: React.FormEvent) {
    event.preventDefault();
    if (!categoryInput.trim()) return;
    try {
      const updated = await addRiskMerchant(undefined, categoryInput.trim());
      setConfig(updated);
      setCategoryInput("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo agregar la categoría.");
    }
  }

  async function handleRemoveMerchant(merchantId: string) {
    const updated = await removeRiskMerchant(merchantId);
    setConfig(updated);
  }

  async function handleRemoveCategory(category: string) {
    const updated = await removeRiskMerchant(undefined, category);
    setConfig(updated);
  }

  return (
    <div className="page">
      <header className="page__header">
        <h1>Comercios de Riesgo</h1>
        <p className="page__subtitle">Comercios y categorías que activan la regla de comercio de riesgo.</p>
      </header>

      {loading && <p className="state-text">Cargando...</p>}
      {error && <p className="error-text">{error}</p>}

      {!loading && (
        <>
          <section className="card">
            <h2>Comercios marcados</h2>
            <ul className="tag-list">
              {config.riskMerchants.map((merchant) => (
                <li key={merchant} className="tag">
                  {merchant}
                  {canEdit && (
                    <button type="button" className="tag__remove" onClick={() => handleRemoveMerchant(merchant)}>
                      ×
                    </button>
                  )}
                </li>
              ))}
              {config.riskMerchants.length === 0 && <p className="state-text">Ningún comercio marcado.</p>}
            </ul>

            {canEdit && (
              <form className="inline-form" onSubmit={handleAddMerchant}>
                <input
                  value={merchantInput}
                  onChange={(e) => setMerchantInput(e.target.value)}
                  placeholder="ID de comercio, ej. MERCH-123"
                />
                <button type="submit" className="btn btn--primary btn--small">
                  Agregar
                </button>
              </form>
            )}
          </section>

          <section className="card">
            <h2>Categorías marcadas</h2>
            <ul className="tag-list">
              {config.riskCategories.map((category) => (
                <li key={category} className="tag">
                  {category}
                  {canEdit && (
                    <button type="button" className="tag__remove" onClick={() => handleRemoveCategory(category)}>
                      ×
                    </button>
                  )}
                </li>
              ))}
              {config.riskCategories.length === 0 && <p className="state-text">Ninguna categoría marcada.</p>}
            </ul>

            {canEdit && (
              <form className="inline-form" onSubmit={handleAddCategory}>
                <input
                  value={categoryInput}
                  onChange={(e) => setCategoryInput(e.target.value)}
                  placeholder="Categoría, ej. CRYPTO"
                />
                <button type="submit" className="btn btn--primary btn--small">
                  Agregar
                </button>
              </form>
            )}
          </section>

          {!canEdit && <p className="state-text">Su rol tiene acceso de solo lectura a esta sección.</p>}
        </>
      )}
    </div>
  );
}
