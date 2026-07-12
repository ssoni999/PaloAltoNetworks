import { StorySection } from "../story/StorySection";
import { RecommendationCard } from "../story/RecommendationCard";
import { DisclaimerBanner } from "../story/DisclaimerBanner";
import { emilyData } from "../../data/emilyMockData";

export function Stage08Recommendations() {
  return (
    <StorySection
      stageNumber={8}
      title="Recommend Next Steps"
      subtitle="Discoveries become actionable insights — specific enough to try, grounded in Emily's own data."
    >
      <div className="space-y-4">
        {emilyData.recommendations.map((rec, i) => (
          <RecommendationCard key={rec.title} recommendation={rec} index={i} />
        ))}
      </div>
      <DisclaimerBanner />
    </StorySection>
  );
}
