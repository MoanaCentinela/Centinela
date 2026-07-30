import { useState } from "react";

interface DocumentUploadFormProps {
  onSubmit: (filename: string, documentType: string) => Promise<void>;
}

const DOCUMENT_TYPES = [
  { value: "ID_CARD", label: "Cédula de ciudadanía" },
  { value: "BANK_STATEMENT", label: "Extracto bancario" },
  { value: "OTHER", label: "Otro" },
];

export function DocumentUploadForm({ onSubmit }: DocumentUploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState(DOCUMENT_TYPES[0].value);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!file) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(file.name, documentType);
      setFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo adjuntar el documento.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="document-upload" onSubmit={handleSubmit}>
      <label className="field">
        <span>Tipo de documento</span>
        <select value={documentType} onChange={(e) => setDocumentType(e.target.value)}>
          {DOCUMENT_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Archivo</span>
        <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} required />
      </label>

      {error && <p className="error-text">{error}</p>}

      <button type="submit" className="btn btn--primary" disabled={!file || submitting}>
        {submitting ? "Adjuntando..." : "Adjuntar documento"}
      </button>
    </form>
  );
}
