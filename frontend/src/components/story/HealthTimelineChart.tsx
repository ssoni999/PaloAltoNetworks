import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface HealthTimelineChartProps {
  data: { date: string; energy: number; stress: number; sleep: number }[];
}

export function HealthTimelineChart({ data }: HealthTimelineChartProps) {
  const sampled = data.filter((_, i) => i % 5 === 0);

  return (
    <div className="story-card">
      <h4 className="mb-4 text-sm font-semibold text-slate-700">Health timeline</h4>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={sampled}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Line type="monotone" dataKey="energy" stroke="#14b8a6" strokeWidth={2} dot={false} name="Energy" />
            <Line type="monotone" dataKey="stress" stroke="#f97316" strokeWidth={2} dot={false} name="Stress" />
            <Line type="monotone" dataKey="sleep" stroke="#6366f1" strokeWidth={2} dot={false} name="Sleep (hrs)" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

interface AutocorrelationChartProps {
  data: { lag: number; value: number }[];
}

export function AutocorrelationChart({ data }: AutocorrelationChartProps) {
  return (
    <div className="story-card">
      <h4 className="mb-4 text-sm font-semibold text-slate-700">
        Autocorrelation — periodicity signal
      </h4>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="lag" tick={{ fontSize: 11 }} label={{ value: "Lag (days)", position: "insideBottom", offset: -2, fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} domain={[0, 1]} />
            <Tooltip />
            <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
