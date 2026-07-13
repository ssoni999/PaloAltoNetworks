import { StorySection } from "../story/StorySection";
import { ArchitectureDiagram } from "../story/ArchitectureDiagram";

export function Stage09Architecture() {
  return (
    <StorySection
      stageNumber={8}
      title="Show the Technical Engine"
      subtitle="Click each block to see how data flows from wearable streams to ranked insights."
    >
      <ArchitectureDiagram />
    </StorySection>
  );
}
