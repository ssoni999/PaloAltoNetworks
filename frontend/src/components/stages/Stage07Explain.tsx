import { StorySection } from "../story/StorySection";
import { AnomalyBreakdown } from "../story/AnomalyBreakdown";
import { emilyData } from "../../data/emilyMockData";

export function Stage07Explain() {
  return (
    <StorySection
      stageNumber={7}
      title="Explain What Happened"
      subtitle="The anomalous period aligns with a time Emily later reported feeling unwell."
    >
      <div className="story-card border-l-4 border-l-blue-400">
        <p className="text-slate-700 leading-relaxed">
          Emily later reported feeling sick during this period. The system did{" "}
          <strong>not</strong> diagnose an illness, but it successfully detected
          that her health state was significantly different from her normal baseline.
        </p>
      </div>

      <AnomalyBreakdown anomaly={emilyData.anomaly} />
    </StorySection>
  );
}
