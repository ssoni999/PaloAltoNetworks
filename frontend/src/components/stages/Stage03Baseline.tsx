import { StorySection } from "../story/StorySection";
import { BaselineBandChart } from "../story/BaselineBandChart";
import { emilyData, getBaselineChartData } from "../../data/emilyMockData";

const FEATURES = [
  {
    name: "Lag features",
    tip: "Uses previous days to measure delayed effects.",
  },
  {
    name: "Rolling averages",
    tip: "Separates one-day fluctuations from sustained changes.",
  },
  {
    name: "Baseline deviation",
    tip: "Measures how unusual today is for Emily.",
  },
  {
    name: "Interaction features",
    tip: "Captures combined effects when multiple metrics shift together.",
  },
];

export function Stage03Baseline() {
  const { baselines } = emilyData;

  return (
    <StorySection
      stageNumber={3}
      title="Learn Her Baseline"
      subtitle="The system compares Emily primarily against her own historical behavior instead of only using population-wide thresholds."
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <BaselineCard label="Typical sleep" value={`${baselines.sleep} hours`} />
        <BaselineCard label="Typical resting heart rate" value={`${baselines.restingHr} BPM`} />
        <BaselineCard label="Typical daily steps" value={baselines.steps.toLocaleString()} />
      </div>

      <BaselineBandChart data={getBaselineChartData()} />

      <div className="story-card">
        <h4 className="mb-4 text-sm font-semibold text-slate-700">
          Feature engineering
        </h4>
        <div className="grid gap-3 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <div
              key={f.name}
              className="group relative rounded-xl bg-slate-50 px-4 py-3"
              title={f.tip}
            >
              <p className="text-sm font-semibold text-slate-800">{f.name}</p>
              <p className="mt-1 text-xs text-slate-500">{f.tip}</p>
            </div>
          ))}
        </div>
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
