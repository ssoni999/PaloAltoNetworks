import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useEngine } from "../../hooks/useEngine";
import { formatMetric } from "../../types/api";
import { DisclaimerBanner } from "../story/DisclaimerBanner";
import { EvaluationMetricCard } from "../story/EvaluationMetricCard";
import { ApiStatusBanner } from "../story/TechnicalPanel";

interface DashboardViewProps {
  onBackToStory: () => void;
}

export function DashboardView({ onBackToStory }: DashboardViewProps) {
  const { analysis, evaluation, loading, error, runAnalysis, runEvaluation } =
    useEngine();
  const [dateRange, setDateRange] = useState(90);
  const [lagFilter, setLagFilter] = useState<number | "all">("all");

  const series = analysis?.result.daily_series ?? [];
  const diagnostics = analysis?.result.diagnostics;
  const correlations = analysis?.result.correlations ?? [];

  const timelineData = useMemo(() => {
    return series.slice(-dateRange).map((p) => ({
      date: p.date.slice(5),
      sleep: p.values.sleep_duration,
      restingHr: p.values.resting_hr,
      hrv: p.values.hrv,
      steps: p.values.steps != null ? p.values.steps / 1000 : null,
    }));
  }, [series, dateRange]);

  const anomalyData = useMemo(() => {
    return (diagnostics?.timeline ?? [])
      .slice(-dateRange)
      .map((d) => ({
        date: d.date.slice(5),
        score: d.combined_score,
        flagged: d.flagged,
      }));
  }, [diagnostics, dateRange]);

  const filteredCorrelations = correlations.filter(
    (c) => lagFilter === "all" || Math.abs(c.lag_days) === lagFilter,
  );

  const matrixMetrics = [
    "sleep_duration",
    "resting_hr",
    "steps",
    "hrv",
    "workout_minutes",
  ];

  function cellCorr(a: string, b: string): number {
    if (a === b) return 1;
    const hit = correlations.find(
      (c) =>
        ((c.metric_a === a && c.metric_b === b) ||
          (c.metric_a === b && c.metric_b === a)) &&
        (c.method === "pearson" || c.method === "spearman"),
    );
    return hit?.strength ?? 0;
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <header className="border-b border-slate-200 bg-white px-4 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              Full Dashboard — live engine
            </h1>
            <p className="text-sm text-slate-500">
              Isolation Forest · Mahalanobis · lagged / partial correlations
            </p>
          </div>
          <div className="flex gap-2">
            {!analysis && (
              <button
                type="button"
                className="btn-primary"
                disabled={loading}
                onClick={() => void runAnalysis()}
              >
                Run analysis
              </button>
            )}
            <button type="button" className="btn-secondary" onClick={onBackToStory}>
              ← Back to Story
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <ApiStatusBanner loading={loading} error={error} meta={analysis?.meta} />

        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="text-xs font-medium text-slate-500">Date range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(Number(e.target.value))}
              className="mt-1 block rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
              <option value={180}>Full window</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500">Lag filter</label>
            <select
              value={String(lagFilter)}
              onChange={(e) =>
                setLagFilter(
                  e.target.value === "all" ? "all" : Number(e.target.value),
                )
              }
              className="mt-1 block rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="all">All lags</option>
              {[0, 1, 2, 3, 7].map((d) => (
                <option key={d} value={d}>
                  {d}d
                </option>
              ))}
            </select>
          </div>
        </div>

        <section className="story-card">
          <h3 className="mb-4 font-semibold">Health timeline (live series)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="sleep" stroke="#6366f1" dot={false} name="Sleep" />
                <Line type="monotone" dataKey="restingHr" stroke="#f97316" dot={false} name="RHR" />
                <Line type="monotone" dataKey="hrv" stroke="#14b8a6" dot={false} name="HRV" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="story-card">
          <h3 className="mb-4 font-semibold">Correlation heatmap (live Pearson/Spearman)</h3>
          <div className="overflow-x-auto">
            <table className="mx-auto text-xs">
              <thead>
                <tr>
                  <th />
                  {matrixMetrics.map((m) => (
                    <th key={m} className="px-1 pb-2 font-medium text-slate-500">
                      {formatMetric(m).split(" ")[0]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrixMetrics.map((row) => (
                  <tr key={row}>
                    <td className="pr-2 font-medium text-slate-600">
                      {formatMetric(row).split(" ")[0]}
                    </td>
                    {matrixMetrics.map((col) => {
                      const v = cellCorr(row, col);
                      const intensity = Math.min(Math.abs(v), 1);
                      const bg =
                        v >= 0
                          ? `rgba(20, 184, 166, ${intensity})`
                          : `rgba(249, 115, 22, ${intensity})`;
                      return (
                        <td key={col} className="p-0.5">
                          <div
                            className="flex h-10 w-10 items-center justify-center rounded font-mono text-[10px] text-slate-800"
                            style={{ background: bg }}
                            title={`${row} × ${col}: ${v.toFixed(2)}`}
                          >
                            {v.toFixed(2)}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="story-card">
          <h3 className="mb-4 font-semibold">
            Correlations (lag filter: {String(lagFilter)})
          </h3>
          <div className="max-h-64 overflow-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs uppercase text-slate-500">
                  <th className="pb-2">Pair</th>
                  <th>r</th>
                  <th>lag</th>
                  <th>method</th>
                  <th>sig</th>
                </tr>
              </thead>
              <tbody>
                {filteredCorrelations.slice(0, 40).map((c, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    <td className="py-1.5">
                      {formatMetric(c.metric_a)} ↔ {formatMetric(c.metric_b)}
                    </td>
                    <td className="font-mono">{c.strength.toFixed(3)}</td>
                    <td>{c.lag_days}d</td>
                    <td>{c.method}</td>
                    <td>{c.significant ? "✓" : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="story-card">
          <h3 className="mb-4 font-semibold">Anomaly timeline (combined score)</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={anomalyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="score" radius={[2, 2, 0, 0]}>
                  {anomalyData.map((entry, i) => (
                    <Cell key={i} fill={entry.flagged ? "#f97316" : "#cbd5e1"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Model evaluation</h3>
            {!evaluation && (
              <button
                type="button"
                className="btn-secondary"
                disabled={loading}
                onClick={() => void runEvaluation()}
              >
                Run /v1/evaluate
              </button>
            )}
          </div>
          {evaluation && (
            <div className="grid gap-4 sm:grid-cols-2">
              <EvaluationMetricCard
                title="Anomaly (IF + Mahalanobis)"
                highlight
                metrics={[
                  { label: "Precision", value: evaluation.metrics.anomaly_precision },
                  { label: "Recall", value: evaluation.metrics.anomaly_recall },
                  { label: "F1", value: evaluation.metrics.anomaly_f1 },
                ]}
              />
              <EvaluationMetricCard
                title="Correlation recovery"
                metrics={[
                  {
                    label: "Recovery",
                    value: `${(evaluation.metrics.correlation_recovery * 100).toFixed(1)}%`,
                  },
                  {
                    label: "Mean |r|",
                    value: evaluation.metrics.correlation_mean_abs_r,
                  },
                  { label: "FDR", value: evaluation.metrics.correlation_fdr },
                ]}
              />
            </div>
          )}
        </section>

        <section>
          <h3 className="mb-4 text-lg font-semibold">Insight feed</h3>
          <ul className="space-y-3">
            {(analysis?.result.insights ?? []).map((insight, i) => (
              <li key={i} className="story-card text-sm">
                <span className="mr-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-600">
                  {insight.kind}
                </span>
                {insight.text}
              </li>
            ))}
          </ul>
        </section>

        <DisclaimerBanner />
      </div>
    </div>
  );
}
