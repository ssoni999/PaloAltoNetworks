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
import type { CorrelationInsight } from "../../types/emily";

interface CorrelationInsightCardProps {
  insight: CorrelationInsight;
  index: number;
  visible: boolean;
}

export function CorrelationInsightCard({
  insight,
  index,
  visible,
}: CorrelationInsightCardProps) {
  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.15, duration: 0.5 }}
      className="story-card border-l-4 border-l-violet-400"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-700">
          {index + 1}
        </span>
        <div className="flex-1">
          <h4 className="font-semibold text-slate-900">{insight.title}</h4>
          <p className="mt-2 text-sm text-slate-600">{insight.interpretation}</p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {insight.correlation != null && (
              <Stat label="Correlation" value={insight.correlation.toFixed(2)} />
            )}
            {insight.effectSize && (
              <Stat label="Effect size" value={insight.effectSize} />
            )}
            {insight.lag && <Stat label="Best lag" value={insight.lag} />}
            {insight.pValue != null && (
              <Stat label="P-value" value={insight.pValue.toFixed(3)} />
            )}
            {insight.confidence != null && (
              <Stat label="Confidence" value={`${insight.confidence}%`} />
            )}
            <Stat label="Sample size" value={`${insight.sampleSize} days`} />
          </div>

          <div className="mt-4 h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={insight.chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2">
      <p className="text-[10px] font-medium uppercase text-slate-500">{label}</p>
      <p className="text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
}
