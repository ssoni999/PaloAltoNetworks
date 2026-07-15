import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { StorySection } from "../story/StorySection";
import { ApiStatusBanner, TechStat } from "../story/TechnicalPanel";
import { useEngine } from "../../hooks/useEngine";
import { formatMetric } from "../../types/api";

const COLORS = ["#f97316", "#6366f1", "#14b8a6", "#8b5cf6", "#64748b"];

export function Stage07Explain() {
  const { analysis, loading, error } = useEngine();
  const top = analysis?.result.diagnostics?.top_anomaly ?? null;
  const anomalies = analysis?.result.anomalies ?? [];
  const topEvent = anomalies[0] ?? null;

  const contributions =
    top == null
      ? []
      : Object.entries(top.z_scores)
          .map(([metric, z]) => ({
            metric,
            absZ: Math.abs(z),
            z,
          }))
          .sort((a, b) => b.absZ - a.absZ);

  const total = contributions.reduce((s, c) => s + c.absZ, 0) || 1;
  const pieData = contributions.slice(0, 5).map((c) => ({
    name: formatMetric(c.metric),
    value: Math.round((c.absZ / total) * 100),
    z: c.z,
  }));

  return (
    <StorySection
      stageNumber={7}
      title="Explain What Happened"
      subtitle="Contribution breakdown from the live feature z-scores."
    >
      <ApiStatusBanner loading={loading} error={error} meta={analysis?.meta} />

      <div className="story-card border-l-4 border-l-blue-400">
        <p className="leading-relaxed text-slate-700">
          The synthetic generator plants a <strong>joint rare state</strong>{" "}
          (short sleep + elevated resting HR + depressed HRV) while keeping
          activity near normal — so univariate thresholds are weak, but the
          multivariate model fires. The system did <strong>not</strong> diagnose
          an illness; it detected that the health-state vector was far from
          Emily&apos;s personal baseline.
        </p>
        {topEvent && (
          <p className="mt-3 text-sm text-slate-600">
            Top event: {topEvent.explanation}
            {topEvent.univariate_ok
              ? " · univariate_ok=true (no single |z|>2.5)"
              : " · univariate_ok=false (at least one metric extreme)"}
          </p>
        )}
      </div>

      {top && (
        <div className="grid gap-3 sm:grid-cols-3">
          <TechStat label="Date" value={top.date} />
          <TechStat label="Combined score" value={top.combined_score} />
          <TechStat
            label="Contributors"
            value={
              top.contributing_metrics.map(formatMetric).join(", ") || "—"
            }
          />
        </div>
      )}

      {pieData.length > 0 ? (
        <div className="story-card">
          <h4 className="mb-4 text-sm font-semibold text-slate-700">
            Contribution breakdown (|z| share of top drivers)
          </h4>
          <div className="flex flex-col items-center gap-6 sm:flex-row">
            <div className="h-52 w-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => `${v}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="flex-1 space-y-3">
              {pieData.map((c, i) => (
                <li key={c.name} className="flex items-center gap-3">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ background: COLORS[i % COLORS.length] }}
                  />
                  <span className="flex-1 text-sm text-slate-700">{c.name}</span>
                  <span className="font-mono text-sm text-slate-500">
                    z={c.z.toFixed(2)}
                  </span>
                  <span className="text-sm font-semibold text-slate-900">
                    {c.value}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-500">
          No top anomaly in diagnostics — run Investigate first.
        </p>
      )}
    </StorySection>
  );
}
