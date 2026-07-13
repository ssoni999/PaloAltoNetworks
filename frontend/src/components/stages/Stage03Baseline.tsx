import { useMemo } from "react";
import { StorySection } from "../story/StorySection";
import { BaselineBandChart } from "../story/BaselineBandChart";
import { ApiStatusBanner, FormulaPanel, TechStat } from "../story/TechnicalPanel";
import { useEngine } from "../../hooks/useEngine";

const FEATURES = [
  {
    name: "Lag features",
    tip: "Uses previous days to measure delayed effects (e.g. workout[t] → sleep[t+1]).",
  },
  {
    name: "Expanding z-scores",
    tip: "z_t = (x_t − μ_1:t) / σ_1:t — personal baseline, not population norms.",
  },
  {
    name: "Baseline deviation",
    tip: "Measures how unusual today is for Emily vs her own history.",
  },
  {
    name: "Interaction features",
    tip: "sleep_z × resting_hr_z and sleep_z × (−hrv_z) capture joint stress states.",
  },
];

export function Stage03Baseline() {
  const { analysis, loading, error } = useEngine();
  const series = analysis?.result.daily_series ?? [];
  const diagnostics = analysis?.result.diagnostics;

  const chartData = useMemo(() => {
    const vals = series
      .map((p) => ({
        date: p.date.slice(5),
        value: p.values.resting_hr,
      }))
      .filter((p): p is { date: string; value: number } => p.value != null);

    const window = 30;
    return vals.map((r, i) => {
      const slice = vals.slice(Math.max(0, i - window + 1), i + 1);
      const rolling =
        slice.reduce((s, x) => s + x.value, 0) / slice.length;
      const std =
        Math.sqrt(
          slice.reduce((s, x) => s + (x.value - rolling) ** 2, 0) / slice.length,
        ) || 3;
      return {
        date: r.date,
        value: r.value,
        rolling: +rolling.toFixed(1),
        upper: +(rolling + std).toFixed(1),
        lower: +(rolling - std).toFixed(1),
      };
    });
  }, [series]);

  const baselines = useMemo(() => {
    const sleep = series
      .map((p) => p.values.sleep_duration)
      .filter((v): v is number => v != null);
    const hr = series
      .map((p) => p.values.resting_hr)
      .filter((v): v is number => v != null);
    const steps = series
      .map((p) => p.values.steps)
      .filter((v): v is number => v != null);
    const avg = (a: number[]) =>
      a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0;
    return {
      sleep: avg(sleep).toFixed(1),
      restingHr: Math.round(avg(hr)),
      steps: Math.round(avg(steps)).toLocaleString(),
    };
  }, [series]);

  const nDays =
    Number(analysis?.meta?.n_days) ||
    series.length ||
    365;

  return (
    <StorySection
      stageNumber={3}
      title="Learn Her Baseline"
      subtitle="The system compares Emily primarily against her own historical behavior instead of only using population-wide thresholds."
    >
      <ApiStatusBanner loading={loading} error={error} meta={analysis?.meta} />

      <div className="story-card border-l-4 border-l-teal-400 bg-gradient-to-br from-slate-900 to-slate-800 px-6 py-5 text-white">
        <p className="font-mono text-sm leading-relaxed sm:text-base">
          <span className="italic">X</span>
          <sub className="text-xs">t</sub>
          {" = [sleep"}
          <sub className="text-xs">t</sub>
          {", restingHR"}
          <sub className="text-xs">t</sub>
          {", steps"}
          <sub className="text-xs">t</sub>
          {", workout"}
          <sub className="text-xs">t</sub>
          {", HRV"}
          <sub className="text-xs">t</sub>
          {", caffeine"}
          <sub className="text-xs">t</sub>
          {", screenTime"}
          <sub className="text-xs">t</sub>
          {", alcohol"}
          <sub className="text-xs">t</sub>
          {", outdoorTime"}
          <sub className="text-xs">t</sub>
          ]
        </p>
        <p className="mt-4 text-sm leading-relaxed text-slate-300">
          Across {nDays} days, Emily&apos;s history becomes a multivariate time
          series:
        </p>
        <p className="mt-2 font-mono text-sm sm:text-base">
          <span className="italic">X</span>
          <sub className="text-xs">1</sub>
          {", "}
          <span className="italic">X</span>
          <sub className="text-xs">2</sub>
          {", …, "}
          <span className="italic">X</span>
          <sub className="text-xs">{nDays}</sub>
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <BaselineCard label="Typical sleep" value={`${baselines.sleep} hours`} />
        <BaselineCard
          label="Typical resting heart rate"
          value={`${baselines.restingHr} BPM`}
        />
        <BaselineCard label="Typical daily steps" value={baselines.steps} />
      </div>

      {chartData.length > 0 && (
        <BaselineBandChart
          data={chartData.filter((_, i) => i % 3 === 0)}
          metricLabel="Resting HR — daily + 30-day band (from live series)"
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="story-card">
          <h4 className="mb-4 text-sm font-semibold text-slate-700">
            Feature engineering
          </h4>
          <div className="grid gap-3">
            {FEATURES.map((f) => (
              <div key={f.name} className="rounded-xl bg-slate-50 px-4 py-3">
                <p className="text-sm font-semibold text-slate-800">{f.name}</p>
                <p className="mt-1 text-xs text-slate-500">{f.tip}</p>
              </div>
            ))}
          </div>
        </div>

        {diagnostics && (
          <div className="space-y-4">
            <FormulaPanel
              formulas={{
                expanding_z: diagnostics.formulas.expanding_z,
                univariate_gate: diagnostics.formulas.univariate_gate,
              }}
              title="Baseline math"
            />
            <div className="grid grid-cols-2 gap-2">
              <TechStat
                label="Feature dims"
                value={diagnostics.feature_names.length}
                hint="z-scores + interactions"
              />
              <TechStat
                label="Warm-up"
                value="14 days"
                hint="min_periods for expanding stats"
              />
            </div>
            <div className="story-card">
              <h4 className="mb-2 text-xs font-semibold uppercase text-slate-500">
                Feature vector columns
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {diagnostics.feature_names.map((f) => (
                  <span
                    key={f}
                    className="rounded-md bg-indigo-50 px-2 py-0.5 font-mono text-[10px] text-indigo-700"
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </StorySection>
  );
}

function BaselineCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-teal-50 to-blue-50 p-6 text-center shadow-soft">
      <p className="text-xs font-medium uppercase tracking-wide text-teal-700">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
