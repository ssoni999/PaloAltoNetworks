export const STORY_STAGES = [
  { id: 0, label: "Meet Emily", short: "Emily" },
  { id: 1, label: "Connect the Data", short: "Data" },
  { id: 2, label: "Learn Her Baseline", short: "Baseline" },
  { id: 3, label: "Hidden Correlations", short: "Correlations" },
  { id: 4, label: "Recurring Patterns", short: "Patterns" },
  { id: 5, label: "Detect an Anomaly", short: "Anomaly" },
  { id: 6, label: "Explain What Happened", short: "Explain" },
  { id: 7, label: "Technical Engine", short: "Engine" },
  { id: 8, label: "Evaluation Results", short: "Results" },
  { id: 9, label: "Health Advisor", short: "Chat" },
] as const;

export type StoryStageId = (typeof STORY_STAGES)[number]["id"];

export type AppMode = "story" | "dashboard";
