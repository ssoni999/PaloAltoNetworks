interface MetricCardProps {
  label: string;
  value: string;
  unit?: string;
  accent?: "green" | "blue" | "purple";
}

const accentMap = {
  green: "from-emerald-50 to-teal-50 border-emerald-100 text-emerald-700",
  blue: "from-blue-50 to-sky-50 border-blue-100 text-blue-700",
  purple: "from-violet-50 to-purple-50 border-violet-100 text-violet-700",
};

export function MetricCard({
  label,
  value,
  unit,
  accent = "green",
}: MetricCardProps) {
  return (
    <div
      className={`rounded-xl border bg-gradient-to-br p-4 ${accentMap[accent]}`}
    >
      <p className="text-xs font-medium uppercase tracking-wide opacity-80">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-slate-900">
        {value}
        {unit && (
          <span className="ml-1 text-sm font-normal text-slate-600">{unit}</span>
        )}
      </p>
    </div>
  );
}
