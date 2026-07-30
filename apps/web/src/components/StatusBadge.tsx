import type { CaseStatus } from "../api/types";

const LABELS: Record<CaseStatus, { text: string; icon: string; className: string }> = {
  OPEN: { text: "Abierto", icon: "🟡", className: "badge badge--open" },
  RESOLVED: { text: "Resuelto", icon: "🟢", className: "badge badge--resolved" },
};

export function StatusBadge({ status }: { status: CaseStatus }) {
  const { text, icon, className } = LABELS[status];
  return (
    <span className={className}>
      {icon} {text}
    </span>
  );
}
