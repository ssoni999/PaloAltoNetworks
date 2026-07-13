import type { PatternFinding } from "../types/api";
import { formatMetric, formatPValue } from "../types/api";

export interface PatternNarrative {
  title: string;
  summary: string;
  direction: "positive" | "inverse";
  directionLabel: string;
  timing: string;
}

/** Whether the event group shows a higher value for the outcome metric. */
function eventGroupHasHigherOutcome(p: PatternFinding): boolean {
  // low_outdoor stores effect_size as -Cohen's d (low vs high outdoor → sleep)
  if (p.condition === "low_outdoor") {
    return p.effect_size < 0;
  }
  return p.effect_size > 0;
}

function outcomeWord(p: PatternFinding): string {
  return eventGroupHasHigherOutcome(p) ? "higher" : "lower";
}

function directionInfo(p: PatternFinding): {
  direction: "positive" | "inverse";
  directionLabel: string;
} {
  const raises = eventGroupHasHigherOutcome(p);
  return {
    direction: raises ? "positive" : "inverse",
    directionLabel: raises ? "Positively associated" : "Inversely associated",
  };
}

const TIMING: Record<string, string> = {
  afternoon_workout: "Next-night effect (workout day → following sleep)",
  high_caffeine: "Next-night effect (caffeine day → following sleep)",
  alcohol_evening: "Next-night effect (drinking day → following sleep)",
  low_outdoor: "Next-night effect (outdoor exposure → following sleep)",
  high_screen_time: "Delayed effect (~2 days later on HRV)",
  high_steps: "Same-day effect",
  short_sleep: "Same-morning effect (short sleep night → waking HR)",
};

function buildSummary(p: PatternFinding): string {
  const outcome = formatMetric(p.outcome);
  const change = outcomeWord(p);
  const d = Math.abs(p.effect_size).toFixed(2);

  switch (p.condition) {
    case "short_sleep":
      return `Nights in the bottom sleep quartile showed ${change} ${outcome} than long-sleep nights — short sleep tracks with elevated resting heart rate (d=${d}, n=${p.support}).`;
    case "afternoon_workout":
      return `Workouts after 2pm were followed by ${change} ${outcome} the next night compared with morning workouts (d=${d}, n=${p.support}).`;
    case "high_steps":
      return `Days in the top step quartile had ${change} same-day ${outcome} than low-step days (d=${d}, n=${p.support}).`;
    case "high_caffeine":
      return `High-caffeine days were followed by ${change} ${outcome} the next night versus low-caffeine days (d=${d}, n=${p.support}).`;
    case "high_screen_time":
      return `Heavy pre-bed screen time was followed by ${change} ${outcome} about two days later compared with light screen nights (d=${d}, n=${p.support}).`;
    case "alcohol_evening":
      return `Evenings with alcohol were followed by ${change} ${outcome} the next night versus sober evenings (d=${d}, n=${p.support}).`;
    case "low_outdoor":
      return `Days with low outdoor exposure were followed by ${change} ${outcome} the next night versus high-exposure days (d=${d}, n=${p.support}).`;
    default:
      return `When "${p.condition.replace(/_/g, " ")}" occurs, ${outcome} tends to be ${change} than the comparison group (d=${d}, n=${p.support}, p=${formatPValue(p.p_value)}).`;
  }
}

const TITLES: Record<string, string> = {
  short_sleep: "Short sleep → resting heart rate",
  afternoon_workout: "Afternoon workout → sleep duration",
  high_steps: "High step count → HRV",
  high_caffeine: "High caffeine → sleep duration",
  high_screen_time: "Pre-bed screen time → HRV",
  alcohol_evening: "Alcohol → sleep duration",
  low_outdoor: "Low outdoor time → sleep duration",
};

export function getPatternNarrative(p: PatternFinding): PatternNarrative {
  const { direction, directionLabel } = directionInfo(p);
  return {
    title: TITLES[p.condition] ?? `${p.condition.replace(/_/g, " ")} → ${formatMetric(p.outcome)}`,
    summary: buildSummary(p),
    direction,
    directionLabel,
    timing: TIMING[p.condition] ?? "Conditional event → outcome",
  };
}
