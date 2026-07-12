import { useCallback, useState } from "react";
import type { AppMode, StoryStageId } from "../constants/story";
import { STORY_STAGES } from "../constants/story";

export function useStoryNavigation(initialStage: StoryStageId = 0) {
  const [stage, setStage] = useState<StoryStageId>(initialStage);
  const [mode, setMode] = useState<AppMode>("story");
  const maxStage = STORY_STAGES.length - 1;

  const goNext = useCallback(() => {
    setStage((s) => Math.min(s + 1, maxStage) as StoryStageId);
  }, [maxStage]);

  const goBack = useCallback(() => {
    setStage((s) => Math.max(s - 1, 0) as StoryStageId);
  }, []);

  const goTo = useCallback(
    (id: StoryStageId) => {
      setStage(Math.max(0, Math.min(id, maxStage)) as StoryStageId);
    },
    [maxStage],
  );

  const restart = useCallback(() => {
    setStage(0);
    setMode("story");
  }, []);

  const openDashboard = useCallback(() => {
    setMode("dashboard");
  }, []);

  const backToStory = useCallback(() => {
    setMode("story");
  }, []);

  return {
    stage,
    mode,
    goNext,
    goBack,
    goTo,
    restart,
    openDashboard,
    backToStory,
    isFirst: stage === 0,
    isLast: stage === maxStage,
    currentStage: STORY_STAGES[stage],
  };
}
