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
import { emilyData, getDashboardCorrelationMatrix } from "../../data/emilyMockData";
import type { DailyRecord, Recommendation } from "../../types/emily";
import { DisclaimerBanner } from "../story/DisclaimerBanner";
import { EvaluationMetricCard } from "../story/EvaluationMetricCard";
import { RecommendationCard } from "../story/RecommendationCard";

interface DashboardViewProps {
  onBackToStory: () => void;
}

export function DashboardView({ onBackToStory }: DashboardViewProps) {
  const [dateRange, setDateRange] = useState(90);
  const [lag, setLag] = useState(1);

  const timelineData = useMemo(() => {
    return emilyData.records
      .filter((r: DailyRecord) => !Number.isNaN(r.energy))
      .slice(-dateRange)
      .map((r: DailyRecord) => ({
        date: r.date.slice(5),
        energy: r.energy,
        stress: r.stress,
        sleep: r.sleepDuration,
        anomaly: r.isAnomaly ? r.energy : null,
      }));
  }, [dateRange]);

  const { metrics, matrix } = getDashboardCorrelationMatrix();

  const anomalyData = emilyData.records
    .filter((r: DailyRecord) => !Number.isNaN(r.restingHr))
    .slice(-dateRange)
    .map((r: DailyRecord, i: number) => ({
      date: r.date.slice(5),
      score: r.isAnomaly ? 0.97 : 0.1 + ((i * 13) % 30) / 100,
      flagged: r.isAnomaly,
    }));

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <header className="border-b border-slate-200 bg-white px-4 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              Full Dashboard — Emily
            </h1>
            <p className="text-sm text-slate-500">
              Deeper technical exploration · mock data
            </p>
          </div>
          <button type="button" className="btn-secondary" onClick={onBackToStory}>
            ← Back to Story
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <div className="flex flex-wrap items-end gap-4">
          <div className="form-group">
            <label className="text-xs font-medium text-slate-500">Date range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(Number(e.target.value))}
              className="mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
              <option value={180}>Full 6 months</option>
            </select>
          </div>
          <div className="form-group">
            <label className="text-xs font-medium text-slate-500">Correlation lag</label>
            <select
              value={lag}
              onChange={(e) => setLag(Number(e.target.value))}
              className="mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              {[0, 1, 2, 3, 7].map((d) => (
                <option key={d} value={d}>
                  {d} day{d !== 1 ? "s" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        <section className="story-card">
          <h3 className="mb-4 font-semibold">Health timeline</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="energy" stroke="#14b8a6" dot={false} name="Energy" />
                <Line type="monotone" dataKey="stress" stroke="#f97316" dot={false} name="Stress" />
                <Line type="monotone" dataKey="sleep" stroke="#6366f1" dot={false} name="Sleep" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="story-card">
          <h3 className="mb-4 font-semibold">
            Correlation heatmap <span className="text-sm font-normal text-slate-500">(lag {lag}d)</span>
          </h3>
          <div className="overflow-x-auto">
            <table className="mx-auto text-xs">
              <thead>
                <tr>
                  <th />
                  {metrics.map((m) => (
                    <th key={m} className="px-1 pb-2 font-medium text-slate-500">
                      {m}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {metrics.map((row) => (
                  <tr key={row}>
                    <td className="pr-2 font-medium text-slate-600">{row}</td>
                    {metrics.map((col) => {
                      const cell = matrix.find((c) => c.x === row && c.y === col);
                      const v = cell?.value ?? 0;
                      const intensity = Math.abs(v);
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
          <h3 className="mb-4 font-semibold">Anomaly timeline</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={anomalyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10 }} domain={[0, 1]} />
                <Tooltip />
                <Bar dataKey="score" radius={[2, 2, 0, 0]}>
                  {anomalyData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.flagged ? "#f97316" : "#cbd5e1"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section>
          <h3 className="mb-4 text-lg font-semibold">Pattern detection</h3>
          <div className="story-card">
            <p className="font-semibold text-orange-700">{emilyData.pattern.name}</p>
            <p className="mt-2 text-sm text-slate-600">
              7-day periodicity · {emilyData.pattern.confidence}% confidence ·{" "}
              {emilyData.pattern.occurrences} occurrences
            </p>
          </div>
        </section>

        <section>
          <h3 className="mb-4 text-lg font-semibold">Personalized insight feed</h3>
          <div className="space-y-4">
            {emilyData.recommendations.map((rec: Recommendation, i: number) => (
              <RecommendationCard key={rec.title} recommendation={rec} index={i} />
            ))}
          </div>
        </section>

        <section>
          <h3 className="mb-4 text-lg font-semibold">Model evaluation</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <EvaluationMetricCard
              title="Isolation Forest"
              highlight
              metrics={[
                { label: "Precision", value: emilyData.evaluation.isolationForest.precision },
                { label: "Recall", value: emilyData.evaluation.isolationForest.recall },
                { label: "F1", value: emilyData.evaluation.isolationForest.f1 },
              ]}
            />
            <EvaluationMetricCard
              title="Correlation recovery"
              metrics={[
                { label: "Planted", value: emilyData.evaluation.correlationDiscovery.planted },
                { label: "Recovered", value: emilyData.evaluation.correlationDiscovery.recovered },
                { label: "Precision", value: `${(emilyData.evaluation.correlationDiscovery.precision * 100).toFixed(1)}%` },
              ]}
            />
          </div>
        </section>

        <DisclaimerBanner />
      </div>
    </div>
  );
}
