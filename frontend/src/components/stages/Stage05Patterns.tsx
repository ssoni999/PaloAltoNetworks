import { StorySection } from "../story/StorySection";
import { AutocorrelationChart } from "../story/HealthTimelineChart";
import { ApiStatusBanner, TechStat } from "../story/TechnicalPanel";
import { useEngine } from "../../hooks/useEngine";
import { formatMetric, formatPValue } from "../../types/api";
import { getPatternNarrative } from "../../utils/patternDescriptions";
import { emilyData } from "../../data/emilyMockData";

export function Stage05Patterns() {
  const { analysis, loading, error } = useEngine();
  const patterns = analysis?.result.patterns ?? [];

  return (
    <StorySection
      stageNumber={5}
      title="Identify Recurring Patterns"
      subtitle="Conditional event→outcome rules and periodicity from the live pattern discovery module."
    >
      <ApiStatusBanner loading={loading} error={error} meta={analysis?.meta} />

      <div className="grid gap-3 sm:grid-cols-3">
        <TechStat label="Patterns found" value={patterns.length} />
        <TechStat
          label="Significant"
          value={patterns.filter((p) => p.significant).length}
        />
        <TechStat
          label="Methods"
          value="grouped + ACF / FFT"
          hint="patterns/discovery.py"
        />
      </div>

      <p className="rounded-xl bg-orange-50 px-4 py-3 text-sm text-orange-900">
        Each pattern compares an <strong>event group</strong> (e.g. short-sleep
        nights) to a baseline group and reports whether the outcome metric is{" "}
        <strong>higher or lower</strong> — not just that two variables co-move.
      </p>

      <div className="space-y-4">
        {patterns.map((p) => {
          const narrative = getPatternNarrative(p);
          return (
            <div
              key={`${p.condition}-${p.outcome}`}
              className="story-card border-l-4 border-l-orange-400"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h4 className="text-lg font-semibold text-slate-900">
                  {narrative.title}
                </h4>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    narrative.direction === "positive"
                      ? "bg-violet-100 text-violet-800"
                      : "bg-amber-100 text-amber-900"
                  }`}
                >
                  {narrative.directionLabel}
                </span>
              </div>

              <p className="mt-2 text-sm leading-relaxed text-slate-700">
                {narrative.summary}
              </p>

              <p className="mt-2 text-xs text-slate-500">{narrative.timing}</p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-lg bg-slate-50 px-2 py-1 font-mono text-xs text-slate-600">
                  {p.condition.replace(/_/g, " ")} → {formatMetric(p.outcome)}
                </span>
                <span className="text-xs text-slate-500">
                  d={p.effect_size.toFixed(3)} · n={p.support} · p=
                  {formatPValue(p.p_value)}
                  {p.period_hint_days != null
                    ? ` · ~${p.period_hint_days.toFixed(0)}d rhythm`
                    : ""}
                </span>
                {p.significant ? (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                    significant
                  </span>
                ) : (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                    exploratory
                  </span>
                )}
              </div>
            </div>
          );
        })}
        {patterns.length === 0 && !loading && (
          <p className="text-sm text-slate-500">
            No patterns loaded — run Investigate on stage 1.
          </p>
        )}
      </div>

      <AutocorrelationChart data={emilyData.autocorrelation} />
      <p className="text-sm text-slate-600">
        Autocorrelation peaks near lag 7 illustrate weekly periodicity in the
        synthetic generator (sinusoidal weekly driver). The engine&apos;s
        periodicity module estimates similar structure from the aligned frame.
      </p>
    </StorySection>
  );
}
