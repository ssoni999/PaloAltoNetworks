interface EvaluationMetricCardProps {
  title: string;
  metrics: { label: string; value: string | number }[];
  highlight?: boolean;
}

export function EvaluationMetricCard({
  title,
  metrics,
  highlight,
}: EvaluationMetricCardProps) {
  return (
    <div
      className={`story-card ${highlight ? "ring-2 ring-health-400 ring-offset-2" : ""}`}
    >
      <h4 className="mb-4 font-semibold text-slate-900">{title}</h4>
      <dl className="space-y-3">
        {metrics.map((m) => (
          <div key={m.label} className="flex items-center justify-between">
            <dt className="text-sm text-slate-600">{m.label}</dt>
            <dd className="font-mono text-sm font-semibold text-slate-900">
              {typeof m.value === "number" ? m.value.toFixed(2) : m.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

interface RubricBarProps {
  label: string;
  value: number;
  max?: number;
}

export function RubricBar({ label, value, max = 5 }: RubricBarProps) {
  const pct = (value / max) * 100;
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="text-slate-600">{label}</span>
        <span className="font-semibold text-slate-900">{value.toFixed(1)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-health-400 to-health-600 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
