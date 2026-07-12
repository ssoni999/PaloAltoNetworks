import { Fragment } from "react";

interface PatternHeatmapProps {
  data: { day: string; week: number; value: number }[];
}

const dayOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function PatternHeatmap({ data }: PatternHeatmapProps) {
  const weeks = [...new Set(data.map((d) => d.week))].sort((a, b) => a - b);

  function getValue(week: number, day: string) {
    return data.find((d) => d.week === week && d.day.startsWith(day.slice(0, 3)))
      ?.value;
  }

  function color(v: number | undefined) {
    if (v == null) return "bg-slate-100";
    if (v > 5.5) return "bg-orange-400";
    if (v > 4.5) return "bg-amber-300";
    if (v > 3.5) return "bg-teal-200";
    return "bg-teal-100";
  }

  return (
    <div className="story-card overflow-x-auto">
      <h4 className="mb-4 text-sm font-semibold text-slate-700">
        Weekly fatigue intensity heatmap
      </h4>
      <div className="inline-grid gap-1" style={{ gridTemplateColumns: `auto repeat(${weeks.length}, 1fr)` }}>
        <div />
        {weeks.map((w) => (
          <div key={w} className="text-center text-[10px] text-slate-400">
            W{w + 1}
          </div>
        ))}
        {dayOrder.map((day) => (
          <Fragment key={day}>
            <div
              className={`pr-2 text-xs font-medium ${
                day === "Mon" ? "text-orange-600" : "text-slate-500"
              }`}
            >
              {day}
            </div>
            {weeks.map((week) => {
              const v = getValue(week, day);
              return (
                <div
                  key={`${week}-${day}`}
                  className={`h-6 w-8 rounded ${color(v)} ${
                    day === "Mon" ? "ring-2 ring-orange-300 ring-offset-1" : ""
                  }`}
                  title={v != null ? `Fatigue index: ${v}` : undefined}
                />
              );
            })}
          </Fragment>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
        <span>Low</span>
        <div className="flex gap-0.5">
          <div className="h-3 w-6 rounded bg-teal-100" />
          <div className="h-3 w-6 rounded bg-teal-200" />
          <div className="h-3 w-6 rounded bg-amber-300" />
          <div className="h-3 w-6 rounded bg-orange-400" />
        </div>
        <span>High</span>
        <span className="ml-4 font-medium text-orange-600">Mondays highlighted</span>
      </div>
    </div>
  );
}
