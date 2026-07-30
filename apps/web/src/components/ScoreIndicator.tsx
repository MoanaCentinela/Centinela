function riskLevel(score: number, threshold: number): { label: string; className: string } {
  if (score >= threshold * 1.3) return { label: "Alto", className: "score score--high" };
  if (score >= threshold) return { label: "Medio", className: "score score--medium" };
  return { label: "Bajo", className: "score score--low" };
}

export function ScoreIndicator({ score, threshold }: { score: number; threshold: number }) {
  const { label, className } = riskLevel(score, threshold);
  return (
    <span className={className} title={`Umbral: ${threshold} pts`}>
      {score} pts · {label}
    </span>
  );
}
