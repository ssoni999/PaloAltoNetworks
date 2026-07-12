import { useEffect, useState } from "react";
import { StorySection } from "../story/StorySection";
import { CorrelationInsightCard } from "../story/CorrelationInsightCard";
import { emilyData } from "../../data/emilyMockData";

export function Stage04Correlations() {
  const [revealed, setRevealed] = useState(0);

  useEffect(() => {
    setRevealed(0);
    const timers = emilyData.correlations.map((_, i) =>
      setTimeout(() => setRevealed(i + 1), 600 + i * 800),
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <StorySection
      stageNumber={4}
      title="Discover Hidden Correlations"
      subtitle="The engine tested hundreds of relationships across multiple time lags."
    >
      <p className="rounded-xl bg-violet-50 px-4 py-3 text-sm text-violet-900">
        Clues are appearing one at a time — each association is described in plain
        language, without implying causation.
      </p>

      <div className="space-y-4">
        {emilyData.correlations.map((insight, i) => (
          <CorrelationInsightCard
            key={insight.id}
            insight={insight}
            index={i}
            visible={i < revealed}
          />
        ))}
      </div>
    </StorySection>
  );
}
