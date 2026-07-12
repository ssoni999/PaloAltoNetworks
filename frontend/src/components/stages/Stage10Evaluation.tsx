import { StorySection } from "../story/StorySection";
import {
  EvaluationMetricCard,
  RubricBar,
} from "../story/EvaluationMetricCard";
import { emilyData } from "../../data/emilyMockData";

export function Stage10Evaluation() {
  const { evaluation: ev } = emilyData;

  return (
    <StorySection
      stageNumber={10}
      title="Show Evaluation Results"
      subtitle="How do we know the engine performs well against planted ground truth?"
    >
      <h3 className="text-lg font-semibold text-slate-800">Anomaly Detection Accuracy</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <EvaluationMetricCard
          title="Rolling z-score baseline"
          metrics={[
            { label: "Precision", value: ev.rollingZScore.precision },
            { label: "Recall", value: ev.rollingZScore.recall },
            { label: "F1", value: ev.rollingZScore.f1 },
            { label: "PR-AUC", value: ev.rollingZScore.prAuc },
          ]}
        />
        <EvaluationMetricCard
          title="Isolation Forest"
          highlight
          metrics={[
            { label: "Precision", value: ev.isolationForest.precision },
            { label: "Recall", value: ev.isolationForest.recall },
            { label: "F1", value: ev.isolationForest.f1 },
            { label: "PR-AUC", value: ev.isolationForest.prAuc },
          ]}
        />
      </div>

      <h3 className="text-lg font-semibold text-slate-800">Correlation Discovery</h3>
      <div className="story-card">
        <dl className="grid gap-3 sm:grid-cols-2">
          <Row label="True relationships inserted" value={ev.correlationDiscovery.planted} />
          <Row label="Relationships recovered" value={ev.correlationDiscovery.recovered} />
          <Row label="False discoveries" value={ev.correlationDiscovery.falseDiscoveries} />
          <Row label="Recovery precision" value={`${(ev.correlationDiscovery.precision * 100).toFixed(1)}%`} />
          <Row label="Recovery recall" value={`${(ev.correlationDiscovery.recall * 100).toFixed(1)}%`} />
        </dl>
      </div>

      <h3 className="text-lg font-semibold text-slate-800">Insight Relevance</h3>
      <div className="story-card space-y-4">
        <RubricBar label="Actionability" value={ev.insightRelevance.actionability} />
        <RubricBar label="Specificity" value={ev.insightRelevance.specificity} />
        <RubricBar label="Statistical support" value={ev.insightRelevance.statisticalSupport} />
        <RubricBar label="Personalization" value={ev.insightRelevance.personalization} />
        <RubricBar label="Clarity" value={ev.insightRelevance.clarity} />
        <div className="border-t border-slate-200 pt-4 text-center">
          <p className="text-sm text-slate-500">Average relevance score</p>
          <p className="text-3xl font-bold text-health-700">
            {ev.insightRelevance.average.toFixed(1)}{" "}
            <span className="text-lg font-normal text-slate-500">out of 5</span>
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-gradient-to-r from-teal-50 to-violet-50 p-6 text-center">
        <p className="text-slate-700 leading-relaxed">
          The multivariate model detected combinations that the single-metric baseline
          missed, recovered most of the relationships embedded in the synthetic data,
          and produced insights that evaluators considered specific and actionable.
        </p>
      </div>
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
