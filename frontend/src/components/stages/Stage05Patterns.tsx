import { StorySection } from "../story/StorySection";
import { PatternHeatmap } from "../story/PatternHeatmap";
import { AutocorrelationChart } from "../story/HealthTimelineChart";
import { emilyData } from "../../data/emilyMockData";

export function Stage05Patterns() {
  const { pattern } = emilyData;

  return (
    <StorySection
      stageNumber={5}
      title="Identify Recurring Patterns"
      subtitle="Some fatigue signals repeat on a schedule — not as one-off bad days."
    >
      <PatternHeatmap data={emilyData.weeklyHeatmap} />

      <div className="story-card border-l-4 border-l-orange-400">
        <h4 className="text-xl font-semibold text-slate-900">{pattern.name}</h4>
        <p className="mt-2 text-sm font-medium text-slate-600">Typical sequence:</p>
        <ol className="mt-3 space-y-2">
          {pattern.sequence.map((step, i) => (
            <li key={step} className="flex items-center gap-3 text-sm text-slate-700">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-700">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Stat label="Detected period" value={`${pattern.periodDays} days`} />
          <Stat label="Pattern confidence" value={`${pattern.confidence}%`} />
          <Stat label="Repeated occurrences" value={`${pattern.occurrences} weeks`} />
        </div>
      </div>

      <AutocorrelationChart data={emilyData.autocorrelation} />

      <p className="text-sm text-slate-600">{pattern.explanation}</p>
    </StorySection>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2">
      <p className="text-[10px] font-medium uppercase text-slate-500">{label}</p>
      <p className="text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
}
