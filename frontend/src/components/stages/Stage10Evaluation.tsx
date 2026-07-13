import { useEffect } from "react";
import { StorySection } from "../story/StorySection";
import {
  EvaluationMetricCard,
  RubricBar,
} from "../story/EvaluationMetricCard";
import { ApiStatusBanner, TechStat } from "../story/TechnicalPanel";
import { useEngine } from "../../hooks/useEngine";

export function Stage10Evaluation() {
  const {
    evaluation,
    analysis,
    loading,
    error,
    runEvaluation,
  } = useEngine();

  useEffect(() => {
    if (!evaluation && !loading) {
      void runEvaluation().catch(() => undefined);
    }
    // Auto-fetch once when entering this stage
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const m = evaluation?.metrics;

  return (
    <StorySection
      stageNumber={9}
      title="Show Evaluation Results"
      subtitle="Live scores from POST /v1/evaluate against planted synthetic ground truth."
    >
      <ApiStatusBanner loading={loading} error={error} />

      {!evaluation && !loading && (
        <button type="button" className="btn-primary" onClick={() => void runEvaluation()}>
          Run evaluation harness
        </button>
      )}

      {evaluation && m && (
        <>
          <div className="grid gap-3 sm:grid-cols-4">
            <TechStat label="Correlations found" value={evaluation.correlation_count} />
            <TechStat label="Anomalies found" value={evaluation.anomaly_count} />
            <TechStat label="Patterns found" value={evaluation.pattern_count} />
            <TechStat label="Insights ranked" value={evaluation.insight_count} />
          </div>

          <h3 className="text-lg font-semibold text-slate-800">
            Anomaly detection accuracy
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <EvaluationMetricCard
              title="Multivariate Isolation Forest (this engine)"
              highlight
              metrics={[
                { label: "Precision", value: m.anomaly_precision },
                { label: "Recall", value: m.anomaly_recall },
                { label: "F1", value: m.anomaly_f1 },
              ]}
            />
            <EvaluationMetricCard
              title="Details from ground-truth match (±1 day)"
              metrics={[
                {
                  label: "True positives",
                  value: Number(m.details.anomaly_tp ?? 0),
                },
                {
                  label: "False positives",
                  value: Number(m.details.anomaly_fp ?? 0),
                },
                {
                  label: "False negatives",
                  value: Number(m.details.anomaly_fn ?? 0),
                },
              ]}
            />
          </div>

          <h3 className="text-lg font-semibold text-slate-800">
            Correlation discovery
          </h3>
          <div className="story-card">
            <dl className="grid gap-3 sm:grid-cols-2">
              <Row
                label="Planted relationships recovered"
                value={`${m.details.correlations_recovered ?? "—"} / ${m.details.correlations_planted ?? "—"}`}
              />
              <Row label="Recovery rate" value={`${(m.correlation_recovery * 100).toFixed(1)}%`} />
              <Row label="Mean |r| of recovered" value={m.correlation_mean_abs_r.toFixed(3)} />
              <Row label="FDR among significant" value={m.correlation_fdr.toFixed(3)} />
            </dl>
          </div>

          <h3 className="text-lg font-semibold text-slate-800">
            Insight relevance
          </h3>
          <div className="story-card space-y-4">
            <RubricBar
              label="Precision@k (vs planted truth)"
              value={m.insight_precision_at_k * 5}
            />
            <div className="border-t border-slate-200 pt-4 text-center">
              <p className="text-sm text-slate-500">Composite relevance score</p>
              <p className="text-3xl font-bold text-health-700">
                {(m.insight_relevance_score * 100).toFixed(0)}%
              </p>
              <p className="mt-1 text-xs text-slate-500">
                0.4·precision@k + 0.35·correlation recovery + 0.25·anomaly F1
              </p>
            </div>
          </div>

          {analysis?.result.diagnostics && (
            <div className="rounded-2xl bg-gradient-to-r from-teal-50 to-violet-50 p-6 text-center">
              <p className="leading-relaxed text-slate-700">
                On this run, Isolation Forest + Mahalanobis recovered planted
                joint anomalies with F1={m.anomaly_f1.toFixed(2)}, and lagged /
                partial correlation recovered{" "}
                {(m.correlation_recovery * 100).toFixed(0)}% of planted
                relationships — with FDR=
                {m.correlation_fdr.toFixed(2)} among significant discoveries.
              </p>
            </div>
          )}
        </>
      )}
    </StorySection>
  );
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between border-b border-slate-100 pb-2">
      <dt className="text-sm text-slate-600">{label}</dt>
      <dd className="font-mono text-sm font-semibold">{value}</dd>
    </div>
  );
}
