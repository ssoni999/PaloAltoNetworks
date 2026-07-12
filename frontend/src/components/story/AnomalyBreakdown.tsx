import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { AnomalyDetail } from "../../types/emily";

const COLORS = ["#f97316", "#6366f1", "#14b8a6", "#8b5cf6"];

interface AnomalyBreakdownProps {
  anomaly: AnomalyDetail;
}

export function AnomalyBreakdown({ anomaly }: AnomalyBreakdownProps) {
  const data = anomaly.contributions.map((c) => ({
    name: c.metric,
    value: c.percent,
  }));

  return (
    <div className="story-card">
      <h4 className="mb-4 text-sm font-semibold text-slate-700">
        Contribution breakdown
      </h4>
      <div className="flex flex-col items-center gap-6 sm:flex-row">
        <div className="h-52 w-52">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => `${v}%`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <ul className="flex-1 space-y-3">
          {anomaly.contributions.map((c, i) => (
            <li key={c.metric} className="flex items-center gap-3">
              <span
                className="h-3 w-3 rounded-full"
                style={{ background: COLORS[i % COLORS.length] }}
              />
              <span className="flex-1 text-sm text-slate-700">{c.metric}</span>
              <span className="text-sm font-semibold text-slate-900">
                {c.percent}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
