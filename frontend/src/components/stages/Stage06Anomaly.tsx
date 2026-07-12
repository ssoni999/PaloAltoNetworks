import { StorySection } from "../story/StorySection";
import { AnomalyTimeline } from "../story/AnomalyTimeline";
import { emilyData, getAnomalyTimelineData } from "../../data/emilyMockData";

export function Stage06Anomaly() {
  return (
    <StorySection
      stageNumber={6}
      title="Detect an Anomaly"
      subtitle="Most days look normal individually — but one day stands out when metrics are viewed together."
    >
      <AnomalyTimeline
        data={getAnomalyTimelineData()}
        anomaly={emilyData.anomaly}
      />
    </StorySection>
  );
}
