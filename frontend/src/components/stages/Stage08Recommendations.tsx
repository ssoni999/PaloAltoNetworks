import { StorySection } from "../story/StorySection";
import { DisclaimerBanner } from "../story/DisclaimerBanner";
import { ApiStatusBanner, TechStat } from "../story/TechnicalPanel";
import { useEngine } from "../../hooks/useEngine";
import { formatMetric, formatPValue } from "../../types/api";

export function Stage08Recommendations() {
  const { analysis, loading, error } = useEngine();
  const insights = analysis?.result.insights ?? [];

  return (
    <StorySection
      stageNumber={8}
      title="Recommend Next Steps"
      subtitle="Ranked insights from the live engine — scored for statistical support and actionability."
    >
      <ApiStatusBanner loading={loading} error={error} meta={analysis?.meta} />

      <div className="grid gap-3 sm:grid-cols-3">
        <TechStat label="Top insights" value={insights.length} />
        <TechStat
          label="From correlations"
          value={insights.filter((i) => i.kind === "correlation").length}
        />
        <TechStat
          label="From anomalies / patterns"
          value={
            insights.filter((i) => i.kind === "anomaly" || i.kind === "pattern")
              .length
          }
        />
      </div>

      <div className="space-y-4">
        {insights.map((insight, i) => (
          <div
            key={`${insight.kind}-${i}`}
            className="story-card border-t-4 border-t-health-500"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-health-100 text-sm font-bold text-health-700">
                {i + 1}
              </span>
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                      insight.kind === "correlation"
                        ? "bg-sky-100 text-sky-700"
                        : insight.kind === "anomaly"
                          ? "bg-orange-100 text-orange-700"
                          : "bg-violet-100 text-violet-700"
                    }`}
                  >
                    {insight.kind}
                  </span>
                  <span className="font-mono text-xs text-slate-500">
                    score {insight.score.toFixed(3)}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-slate-800">
                  {insight.text}
                </p>
                {insight.kind === "correlation" && insight.evidence && (
                  <p className="text-xs text-slate-500">
                    Evidence: {formatMetric(String(insight.evidence.metric_a))}{" "}
                    ↔ {formatMetric(String(insight.evidence.metric_b))} · r=
                    {Number(insight.evidence.strength).toFixed(3)} · p=
                    {formatPValue(Number(insight.evidence.p_value))} · lag=
                    {String(insight.evidence.lag_days)}d
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
        {insights.length === 0 && !loading && (
          <p className="text-sm text-slate-500">
            No insights — run Investigate on stage 1.
          </p>
        )}
      </div>
      <DisclaimerBanner />
    </StorySection>
  );
}
