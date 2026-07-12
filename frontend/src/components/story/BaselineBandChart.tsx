import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface BaselineBandChartProps {
  data: {
    date: string;
    value: number;
    rolling: number;
    upper: number;
    lower: number;
  }[];
  metricLabel?: string;
}

export function BaselineBandChart({
  data,
  metricLabel = "Resting HR (BPM)",
}: BaselineBandChartProps) {
  const sampled = data.filter((_, i) => i % 4 === 0);

  return (
    <div className="story-card">
      <h4 className="mb-4 text-sm font-semibold text-slate-700">{metricLabel}</h4>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={sampled}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "#64748b" }}
              interval="preserveStartEnd"
            />
            <YAxis tick={{ fontSize: 11, fill: "#64748b" }} domain={["auto", "auto"]} />
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: "1px solid #e2e8f0",
                fontSize: 12,
              }}
            />
            <Area
              type="monotone"
              dataKey="upper"
              stroke="none"
              fill="#ccfbf1"
              fillOpacity={0.5}
            />
            <Area
              type="monotone"
              dataKey="lower"
              stroke="none"
              fill="#f8fafc"
              fillOpacity={1}
            />
            <Line
              type="monotone"
              dataKey="rolling"
              stroke="#0d9488"
              strokeWidth={2}
              dot={false}
              name="30-day avg"
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#6366f1"
              strokeWidth={1.5}
              dot={false}
              name="Daily"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-4 rounded bg-indigo-400" /> Daily values
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 bg-teal-600" /> 30-day rolling average
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-4 rounded bg-teal-200" /> Normal baseline range
        </span>
      </div>
    </div>
  );
}
