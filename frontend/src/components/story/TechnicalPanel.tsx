interface FormulaPanelProps {
  formulas: Record<string, string>;
  title?: string;
}

export function FormulaPanel({
  formulas,
  title = "Model formulas",
}: FormulaPanelProps) {
  return (
    <div className="story-card border-l-4 border-l-indigo-400 bg-slate-50/80">
      <h4 className="mb-3 text-sm font-semibold text-slate-800">{title}</h4>
      <dl className="space-y-3">
        {Object.entries(formulas).map(([key, formula]) => (
          <div key={key}>
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-indigo-600">
              {key.replace(/_/g, " ")}
            </dt>
            <dd className="mt-0.5 font-mono text-sm text-slate-800">{formula}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

interface TechStatProps {
  label: string;
  value: string | number;
  hint?: string;
}

export function TechStat({ label, value, hint }: TechStatProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-0.5 font-mono text-sm font-semibold text-slate-900">
        {typeof value === "number" ? value.toFixed(3) : value}
      </p>
      {hint && <p className="mt-1 text-[11px] text-slate-500">{hint}</p>}
    </div>
  );
}

interface ApiStatusBannerProps {
  loading?: boolean;
  error?: string | null;
  meta?: Record<string, unknown> | null;
}

export function ApiStatusBanner({ loading, error, meta }: ApiStatusBannerProps) {
  if (loading) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-health-200 bg-health-50 px-4 py-3 text-sm text-health-800">
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-health-400 border-t-transparent" />
        Running the correlation / anomaly / pattern pipeline on the API…
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        <strong>API error:</strong> {error}
        <p className="mt-1 text-xs">
          Start the backend:{" "}
          <code className="rounded bg-red-100 px-1">
            uvicorn health_engine.api.app:app --reload --app-dir src
          </code>
        </p>
      </div>
    );
  }
  if (meta) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs text-slate-500">
        Live engine output · source={String(meta.source ?? "—")} · seed=
        {String(meta.seed ?? "—")} · n_days={String(meta.n_days ?? "—")}
      </div>
    );
  }
  return null;
}
