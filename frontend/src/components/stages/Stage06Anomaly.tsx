import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { StorySection } from "../story/StorySection";
import {
  ApiStatusBanner,
  FormulaPanel,
  TechStat,
} from "../story/TechnicalPanel";
import { useEngine } from "../../hooks/useEngine";
import { formatMetric, type DayAnomalyScore } from "../../types/api";

export function Stage06Anomaly() {
  const { analysis, loading, error } = useEngine();
  const diagnostics = analysis?.result.diagnostics;
  const timeline = diagnostics?.timeline ?? [];
  const top = diagnostics?.top_anomaly ?? null;
  const [selected, setSelected] = useState<DayAnomalyScore | null>(null);

  const active = selected ?? top;

  const chartData = useMemo(() => {
    return timeline
      .filter((_, i) => i % 2 === 0 || timeline[i].flagged)
      .map((d) => ({
        date: d.date.slice(5),
        iso: d.iso_score,
        maha: d.mahalanobis,
        combined: d.combined_score,
        flagged: d.flagged,
        full: d,
      }));
  }, [timeline]);

  return (
    <StorySection
      stageNumber={6}
      title="Detect an Anomaly"
      subtitle="Most days look normal individually — but multivariate Isolation Forest + Mahalanobis flags rare joint states."
    >
      <ApiStatusBanner loading={loading} error={error} meta={analysis?.meta} />

      {diagnostics && (
        <div className="grid gap-3 sm:grid-cols-4">
          <TechStat label="Contamination" value={diagnostics.contamination} />
          <TechStat label="IF score p95" value={diagnostics.iso_p95} hint="very-strong IF gate" />
          <TechStat
            label="Mahalanobis p90"
            value={diagnostics.mahalanobis_p90}
            hint="elevated distance gate"
          />
          <TechStat
            label="Days scored"
            value={timeline.length}
            hint={`${timeline.filter((d) => d.flagged).length} flagged`}
          />
        </div>
      )}

      {diagnostics && <FormulaPanel formulas={diagnostics.formulas} />}

      <div className="story-card">
        <h4 className="mb-2 text-sm font-semibold text-slate-700">
          Live anomaly timeline (Isolation Forest score)
        </h4>
        <p className="mb-4 text-xs text-slate-500">
          Orange markers = days that passed the multivariate decision rule. Click
          a flagged day to inspect z-scores and feature vector.
        </p>
        {chartData.length > 0 ? (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    value.toFixed(3),
                    name,
                  ]}
                />
                {diagnostics && (
                  <ReferenceLine
                    y={diagnostics.iso_p95}
                    stroke="#6366f1"
                    strokeDasharray="4 4"
                    label={{ value: "IF p95", fontSize: 10, fill: "#6366f1" }}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="iso"
                  stroke="#94a3b8"
                  strokeWidth={1.5}
                  dot={(props) => {
                    const { cx, cy, payload } = props;
                    if (!payload?.flagged) {
                      return (
                        <circle
                          key={`${payload?.date}-n`}
                          cx={cx}
                          cy={cy}
                          r={2}
                          fill="#cbd5e1"
                        />
                      );
                    }
                    return (
                      <circle
                        key={`${payload?.date}-f`}
                        cx={cx}
                        cy={cy}
                        r={6}
                        fill="#f97316"
                        stroke="#fff"
                        strokeWidth={2}
                        style={{ cursor: "pointer" }}
                        onClick={() => setSelected(payload.full)}
                      />
                    );
                  }}
                  name="iso_score"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            No diagnostics yet — run Investigate on stage 1.
          </p>
        )}
      </div>

      <AnimatePresence mode="wait">
        {active && (
          <motion.div
            key={active.date}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="overflow-hidden rounded-xl border border-orange-200 bg-orange-50/50 p-5"
          >
            <h5 className="text-lg font-semibold text-slate-900">
              Multivariate anomaly · {active.date}
            </h5>
            <p className="mt-1 text-sm text-slate-600">
              Combined score{" "}
              <span className="font-mono font-bold text-orange-600">
                {active.combined_score.toFixed(3)}
              </span>
              {" · "}
              IF={active.iso_score.toFixed(3)} · d_M=
              {active.mahalanobis.toFixed(2)}
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(active.z_scores).map(([metric, z]) => (
                <div
                  key={metric}
                  className="rounded-lg bg-white px-3 py-2 shadow-sm"
                >
                  <p className="text-xs text-slate-500">{formatMetric(metric)}</p>
                  <p className="font-mono text-sm font-semibold">
                    z = {z.toFixed(2)}
                    {active.univariate_flags[metric] ? (
                      <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] text-amber-700">
                        |z|&gt;2.5
                      </span>
                    ) : (
                      <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">
                        in range
                      </span>
                    )}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <ComparisonCard
                title="Simple threshold model (|z| > 2.5)"
                items={Object.entries(active.univariate_flags).map(
                  ([metric, flagged]) => ({
                    label: formatMetric(metric),
                    flagged,
                  }),
                )}
              />
              <ComparisonCard
                title="Multivariate Isolation Forest + Mahalanobis"
                items={[
                  {
                    label: "Full health state",
                    flagged: active.flagged,
                    highlight: true,
                  },
                  {
                    label: "IF outlier label",
                    flagged: active.iso_outlier,
                  },
                ]}
              />
            </div>

            <div className="mt-4 story-card">
              <h6 className="text-xs font-semibold uppercase text-slate-500">
                Feature vector on this day
              </h6>
              <div className="mt-2 grid gap-1 sm:grid-cols-2">
                {Object.entries(active.feature_vector).map(([k, v]) => (
                  <div
                    key={k}
                    className="flex justify-between font-mono text-[11px] text-slate-700"
                  >
                    <span>{k}</span>
                    <span>{v.toFixed(3)}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </StorySection>
  );
}

function ComparisonCard({
  title,
  items,
}: {
  title: string;
  items: { label: string; flagged: boolean; highlight?: boolean }[];
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <h6 className="text-sm font-semibold text-slate-800">{title}</h6>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li
            key={item.label}
            className="flex items-center justify-between text-sm"
          >
            <span className="text-slate-600">{item.label}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                item.flagged
                  ? item.highlight
                    ? "bg-orange-100 text-orange-700"
                    : "bg-amber-100 text-amber-700"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {item.flagged ? "Flagged" : "Not flagged"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
