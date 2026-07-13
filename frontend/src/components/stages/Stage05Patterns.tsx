import { StorySection } from "../story/StorySection";
import { AutocorrelationChart } from "../story/HealthTimelineChart";
import { ApiStatusBanner, TechStat } from "../story/TechnicalPanel";
import { useEngine } from "../../hooks/useEngine";
import { formatMetric, formatPValue } from "../../types/api";
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

      <div className="space-y-4">
        {patterns.map((p) => (
          <div
            key={`${p.condition}-${p.outcome}`}
            className="story-card border-l-4 border-l-orange-400"
          >
            <h4 className="text-lg font-semibold text-slate-900">
              {p.condition.replace(/_/g, " ")} → {formatMetric(p.outcome)}
            </h4>
            <p className="mt-2 text-sm text-slate-600">
              Effect size d={p.effect_size.toFixed(3)} · support n={p.support} ·
              p={formatPValue(p.p_value)}
              {p.period_hint_days != null
                ? ` · period hint ~${p.period_hint_days.toFixed(0)}d`
                : ""}
            </p>
            <div className="mt-3">
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
        ))}
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
