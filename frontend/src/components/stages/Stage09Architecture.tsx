import { AgenticPipelineOverview } from "../story/AgenticPipelineOverview";
import { ArchitectureDiagram } from "../story/ArchitectureDiagram";
import { StorySection } from "../story/StorySection";

export function Stage09Architecture() {
  return (
    <StorySection
      stageNumber={8}
      title="Show the Technical Engine"
      subtitle="Click each block to see how data flows from wearable streams to ranked insights — and how you would wire the same pipeline through an agentic framework."
    >
      <ArchitectureDiagram />

      <div className="border-t border-slate-200 pt-2">
        <h3 className="text-lg font-semibold text-slate-800">
          Agentic framework implementation
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Sequential overview of which steps use an LLM and how many calls each
          new user needs.
        </p>
        <div className="mt-6">
          <AgenticPipelineOverview />
        </div>
      </div>
    </StorySection>
  );
}
