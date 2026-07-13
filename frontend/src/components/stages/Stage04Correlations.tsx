import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { StorySection } from "../story/StorySection";
import { ApiStatusBanner, TechStat } from "../story/TechnicalPanel";
import { useEngine } from "../../hooks/useEngine";
import { formatMetric, formatPValue } from "../../types/api";
import type { CorrelationFinding } from "../../types/api";

export function Stage04Correlations() {
  const { analysis, loading, error } = useEngine();
  const correlations = analysis?.result.correlations ?? [];
  const significant = correlations.filter((c) => c.significant);
  const top = (significant.length ? significant : correlations).slice(0, 6);
  const [revealed, setRevealed] = useState(0);

  useEffect(() => {
    setRevealed(0);
    const n = top.length;
    const timers = Array.from({ length: n }, (_, i) =>
      setTimeout(() => setRevealed(i + 1), 400 + i * 500),
    );
    return () => timers.forEach(clearTimeout);
    // Re-run when analysis payload changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analysis]);

  return (
    <StorySection
      stageNumber={4}
      title="Discover Hidden Correlations"
      subtitle="The engine tested hundreds of relationships across multiple time lags — with FDR correction so we don't overclaim noise."
    >
      <ApiStatusBanner loading={loading} error={error} meta={analysis?.meta} />

      <div className="grid gap-3 sm:grid-cols-4">
        <TechStat label="Total findings" value={correlations.length} />
        <TechStat label="Significant (FDR)" value={significant.length} />
        <TechStat
          label="Methods"
          value={
            [...new Set(correlations.map((c) => c.method))].slice(0, 3).join(", ") ||
            "—"
          }
        />
        <TechStat
          label="Partial / Granger"
          value={
            correlations.filter((c) => c.partial || c.method === "granger").length
          }
        />
      </div>

      <p className="rounded-xl bg-violet-50 px-4 py-3 text-sm text-violet-900">
        Non-obvious signals come from <strong>lagged</strong> correlation (effects
        across days), <strong>partial</strong> correlation (controlling for
        confounders like steps), and <strong>Granger</strong> soft directionality —
        not just same-day Pearson.
      </p>

      <div className="space-y-4">
        {top.map((finding, i) =>
          i < revealed ? (
            <LiveCorrelationCard key={`${finding.metric_a}-${finding.metric_b}-${finding.method}-${i}`} finding={finding} index={i} />
          ) : null,
        )}
        {top.length === 0 && !loading && (
          <p className="text-sm text-slate-500">
            No correlations loaded. Return to stage 1 and run Investigate.
          </p>
        )}
      </div>
    </StorySection>
  );
}

function LiveCorrelationCard({
  finding,
  index,
}: {
  finding: CorrelationFinding;
  index: number;
}) {
  const isGranger = finding.method === "granger";
  const isDirected = finding.method.startsWith("directed_");
  const strengthLabel = isGranger ? "Signed r (at Granger lag)" : "r / strength";
  const direction =
    finding.strength < 0 ? "Inversely" : finding.strength > 0 ? "Positively" : "Not clearly";
  const chartData = [
    { label: formatMetric(finding.metric_a), value: Math.abs(finding.strength) },
    {
      label: `${formatMetric(finding.metric_b)} (lag ${finding.lag_days}d)`,
      value: Math.abs(finding.strength),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      className="story-card border-l-4 border-l-violet-400"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-700">
          {index + 1}
        </span>
        <div className="flex-1">
          <h4 className="font-semibold text-slate-900">
            {formatMetric(finding.metric_a)} ↔ {formatMetric(finding.metric_b)}
          </h4>
          <p className="mt-1 text-sm text-slate-600">
            {direction} associated
            {finding.lag_days !== 0
              ? ` with lag ${finding.lag_days} day(s)`
              : " (same day)"}
            {finding.partial ? " after controlling for confounders" : ""}.
            {isGranger
              ? " Granger test confirms predictability at this lag; signed r shows direction."
              : isDirected
                ? " Directed lag scan (cause leads effect)."
                : ""}
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Mini label={strengthLabel} value={finding.strength.toFixed(3)} />
            <Mini label="Lag" value={`${finding.lag_days}d`} />
            <Mini label="p-value" value={formatPValue(finding.p_value)} />
            <Mini label="Method" value={finding.method} />
            <Mini
              label="Significant"
              value={finding.significant ? "yes (FDR)" : "no"}
            />
          </div>

          <div className="mt-4 h-36">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="value" fill={finding.strength < 0 ? "#f97316" : "#8b5cf6"} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2">
      <p className="text-[10px] font-medium uppercase text-slate-500">{label}</p>
      <p className="font-mono text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
}
