export function ProgressBar({
  value,
  max = 100,
  label,
}: {
  value: number;
  max?: number;
  label?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div>
      {label && (
        <div className="row row--between small" style={{ marginBottom: 6 }}>
          <span>{label}</span>
          <span className="muted">{Math.round(pct)}%</span>
        </div>
      )}
      <div className="progress" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
        <div className="progress__bar" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
