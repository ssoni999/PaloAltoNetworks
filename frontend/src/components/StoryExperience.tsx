import { AnimatePresence } from "framer-motion";
import type { StoryStageId } from "../constants/story";
import { StoryNav } from "./story/StorySection";
import { Stage01MeetEmily } from "./stages/Stage01MeetEmily";
import { Stage02ConnectData } from "./stages/Stage02ConnectData";
import { Stage03Baseline } from "./stages/Stage03Baseline";
import { Stage04Correlations } from "./stages/Stage04Correlations";
import { Stage05Patterns } from "./stages/Stage05Patterns";
import { Stage06Anomaly } from "./stages/Stage06Anomaly";
import { Stage07Explain } from "./stages/Stage07Explain";
import { Stage08Recommendations } from "./stages/Stage08Recommendations";
import { Stage09Architecture } from "./stages/Stage09Architecture";
import { Stage10Evaluation } from "./stages/Stage10Evaluation";
import { StageFinal } from "./stages/StageFinal";

interface StoryExperienceProps {
  stage: StoryStageId;
  isFirst: boolean;
  isLast: boolean;
  onBack: () => void;
  onNext: () => void;
  onRestart: () => void;
  onDashboard: () => void;
}

export function StoryExperience({
  stage,
  isFirst,
  isLast,
  onBack,
  onNext,
  onRestart,
  onDashboard,
}: StoryExperienceProps) {
  const continueLabel =
    stage === 0 ? undefined : isLast ? "Finish" : "Continue";

  return (
    <>
      <AnimatePresence mode="wait">
        <div key={stage}>
          {stage === 0 && (
            <Stage01MeetEmily onInvestigate={onNext} />
          )}
          {stage === 1 && <Stage02ConnectData />}
          {stage === 2 && <Stage03Baseline />}
          {stage === 3 && <Stage04Correlations />}
          {stage === 4 && <Stage05Patterns />}
          {stage === 5 && <Stage06Anomaly />}
          {stage === 6 && <Stage07Explain />}
          {stage === 7 && <Stage08Recommendations />}
          {stage === 8 && <Stage09Architecture />}
          {stage === 9 && <Stage10Evaluation />}
          {stage === 10 && (
            <StageFinal onRestart={onRestart} onDashboard={onDashboard} />
          )}
        </div>
      </AnimatePresence>

      {stage > 0 && stage < 10 && (
        <StoryNav
          onBack={onBack}
          onContinue={onNext}
          canBack={!isFirst}
          continueLabel={continueLabel}
        />
      )}
      {stage === 10 && (
        <div className="h-8" />
      )}
    </>
  );
}
