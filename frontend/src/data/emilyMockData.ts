/**
 * Realistic mock dataset for Emily (~180 days).
 * Planted relationships: sleep→RHR, afternoon workout→sleep, late caffeine→quality,
 * Monday stress cycle, multivariate illness anomaly, missing values + noise.
 */

import type {
  AnomalyDetail,
  CorrelationInsight,
  DailyRecord,
  EmilyDataset,
  EmilyProfile,
  EvaluationMetrics,
  PatternInsight,
  Recommendation,
} from "../types/emily";

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function addDays(iso: string, n: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function dayOfWeek(iso: string): number {
  return new Date(iso).getDay();
}

function generateRecords(): DailyRecord[] {
  const rand = seededRandom(42);
  const start = "2025-01-06";
  const n = 180;
  const records: DailyRecord[] = [];

  let prevSleep = 7.2;
  let prevCaffeineLate = false;

  const anomalyStart = 145;
  const anomalyEnd = 149;

  for (let i = 0; i < n; i++) {
    const date = addDays(start, i);
    const dow = dayOfWeek(date);
    const isMonday = dow === 1;
    const isAnomalyPeriod = i >= anomalyStart && i <= anomalyEnd;
    const isIllnessPeriod = isAnomalyPeriod;

    const missing = rand() < 0.04;
    if (missing) {
      records.push({
        date,
        sleepDuration: NaN,
        sleepQuality: NaN,
        restingHr: NaN,
        steps: NaN,
        workoutMinutes: 0,
        workoutIntensity: 0,
        workoutHour: null,
        stress: NaN,
        caffeine: NaN,
        caffeineAfter3pm: false,
        mood: NaN,
        energy: NaN,
        isAnomaly: false,
        isIllnessPeriod: false,
        dayOfWeek: dow,
      });
      continue;
    }

    const mondayStressBoost = isMonday ? 1.8 : 0;
    const stress = Math.min(
      10,
      Math.max(1, 3.8 + mondayStressBoost + (rand() - 0.5) * 2.5),
    );

    const caffeineAfter3pm = isMonday
      ? rand() < 0.55
      : rand() < 0.22;
    const caffeine = caffeineAfter3pm
      ? 180 + rand() * 120
      : 80 + rand() * 100;
    prevCaffeineLate = caffeineAfter3pm;

    const hadWorkout = rand() < 0.35;
    const afternoonWorkout = hadWorkout && rand() < 0.6;
    const workoutHour = hadWorkout
      ? afternoonWorkout
        ? 14 + Math.floor(rand() * 4)
        : 7 + Math.floor(rand() * 3)
      : null;
    const workoutMinutes = hadWorkout ? 25 + rand() * 45 : 0;
    const workoutIntensity = hadWorkout ? 2 + rand() * 2.5 : 0;

    let sleepDuration = 7.2 + (rand() - 0.5) * 1.4;
    if (afternoonWorkout && workoutMinutes > 30) sleepDuration += 0.55;
    if (caffeineAfter3pm) sleepDuration -= 0.35;
    if (isMonday && prevCaffeineLate) sleepDuration -= 0.25;
    if (isAnomalyPeriod) sleepDuration *= 0.68;

    let sleepQuality = 78 + (rand() - 0.5) * 18;
    if (caffeineAfter3pm) sleepQuality -= 9 + rand() * 4;
    if (sleepDuration < 6.5) sleepQuality -= 6;
    if (isAnomalyPeriod) sleepQuality -= 15;

    const sleepEffect = (7.2 - prevSleep) * 4.5;
    let restingHr = 61 + sleepEffect + (rand() - 0.5) * 4;
    if (isAnomalyPeriod) restingHr *= 1.14;
    if (stress > 6) restingHr += 2;

    let steps = 8450 + (rand() - 0.5) * 3500;
    if (hadWorkout) steps += 1200;
    if (isAnomalyPeriod) steps *= 0.54;

    let mood = 6.5 + (rand() - 0.5) * 2;
    let energy = 6.2 + (rand() - 0.5) * 2.2;
    if (isMonday) {
      mood -= 0.6;
      energy -= 0.8;
    }
    if (dow === 2 && records.length > 0) {
      const prev = records[records.length - 1];
      if (prev.dayOfWeek === 1) energy -= 1.1;
    }
    if (isAnomalyPeriod) {
      mood -= 1.5;
      energy -= 2;
    }

    const isAnomaly = i === anomalyStart + 1;

    records.push({
      date,
      sleepDuration: +sleepDuration.toFixed(2),
      sleepQuality: Math.round(Math.max(20, Math.min(100, sleepQuality))),
      restingHr: Math.round(restingHr),
      steps: Math.round(Math.max(500, steps)),
      workoutMinutes: Math.round(workoutMinutes),
      workoutIntensity: +workoutIntensity.toFixed(1),
      workoutHour,
      stress: +stress.toFixed(1),
      caffeine: Math.round(caffeine),
      caffeineAfter3pm,
      mood: +Math.max(1, Math.min(10, mood)).toFixed(1),
      energy: +Math.max(1, Math.min(10, energy)).toFixed(1),
      isAnomaly,
      isIllnessPeriod,
      dayOfWeek: dow,
    });

    prevSleep = sleepDuration;
  }

  return records;
}

function computeBaselines(records: DailyRecord[]) {
  const valid = records.filter((r) => !Number.isNaN(r.sleepDuration));
  const avg = (fn: (r: DailyRecord) => number) =>
    valid.reduce((s, r) => s + fn(r), 0) / valid.length;
  return {
    sleep: +avg((r) => r.sleepDuration).toFixed(1),
    restingHr: Math.round(avg((r) => r.restingHr)),
    steps: Math.round(avg((r) => r.steps)),
  };
}

function buildWeeklyHeatmap(records: DailyRecord[]) {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const out: { day: string; week: number; value: number }[] = [];
  let week = 0;
  for (let i = 0; i < records.length; i += 7) {
    for (let d = 0; d < 7 && i + d < records.length; d++) {
      const r = records[i + d];
      if (Number.isNaN(r.stress)) continue;
      const fatigue =
        (10 - r.energy) * 0.4 + r.stress * 0.35 + (r.caffeineAfter3pm ? 2 : 0);
      out.push({ day: days[r.dayOfWeek], week, value: +fatigue.toFixed(2) });
    }
    week++;
  }
  return out;
}

function buildAutocorrelation(): { lag: number; value: number }[] {
  const base = [1, 0.22, 0.18, 0.14, 0.12, 0.15, 0.19, 0.72, 0.16, 0.13, 0.11, 0.14, 0.17, 0.41];
  return base.map((value, lag) => ({ lag, value }));
}

const profile: EmilyProfile = {
  name: "Emily",
  age: 29,
  occupation: "Remote Product Designer",
  trackingPeriod: "6 months",
  devices: "Smartwatch & wellness journal",
  mainConcern: "Low morning energy",
  avgSleep: 7.2,
  avgRestingHr: 61,
  avgSteps: 8450,
  avgStress: 4.1,
};

const correlations: CorrelationInsight[] = [
  {
    id: "sleep-rhr",
    title: "Short sleep was associated with a higher resting heart rate the next morning.",
    correlation: -0.62,
    lag: "1 day",
    pValue: 0.003,
    sampleSize: 173,
    interpretation:
      "On nights when Emily slept less than her typical duration, her resting heart rate the following morning tended to be higher — a delayed physiological response.",
    chartData: [
      { label: "6h", value: 68 },
      { label: "6.5h", value: 65 },
      { label: "7h", value: 62 },
      { label: "7.5h", value: 59 },
      { label: "8h", value: 57 },
    ],
    chartType: "bar",
  },
  {
    id: "afternoon-workout",
    title: "Afternoon workouts were associated with 38 additional minutes of sleep.",
    effectSize: "+38 minutes",
    confidence: 94,
    sampleSize: 26,
    interpretation:
      "Workouts completed between 2–5 PM were followed by longer sleep durations compared with late-evening sessions — without implying causation.",
    chartData: [
      { label: "Morning", value: 415 },
      { label: "Afternoon", value: 453 },
      { label: "Evening", value: 398 },
    ],
    chartType: "bar",
  },
  {
    id: "caffeine-sleep",
    title: "Caffeine after 3 PM was associated with lower sleep quality.",
    effectSize: "-9 points",
    confidence: 91,
    sampleSize: 41,
    interpretation:
      "Days with caffeine consumed after 3 PM tended to precede nights with lower sleep-quality scores in Emily's journal.",
    chartData: [
      { label: "Before 3PM", value: 82 },
      { label: "After 3PM", value: 73 },
    ],
    chartType: "bar",
  },
];

const pattern: PatternInsight = {
  name: "Monday Fatigue Cycle",
  periodDays: 7,
  confidence: 93,
  occurrences: 14,
  sequence: [
    "Higher work stress",
    "More afternoon caffeine",
    "Later bedtime",
    "Lower Tuesday-morning energy",
  ],
  explanation:
    "The engine uses autocorrelation to identify patterns that repeat at consistent time intervals.",
};

const records = generateRecords();
const baselines = computeBaselines(records);
const anomalyRecord = records.find((r) => r.isAnomaly);

const anomaly: AnomalyDetail = {
  date: anomalyRecord?.date ?? "2025-05-31",
  score: 0.97,
  deviations: [
    { metric: "Sleep", change: "32% below baseline", direction: "below" },
    { metric: "Resting heart rate", change: "14% above baseline", direction: "above" },
    { metric: "Steps", change: "46% below baseline", direction: "below" },
    { metric: "Stress", change: "38% above baseline", direction: "above" },
  ],
  explanation:
    "No individual metric crossed an extreme threshold. However, this combination of reduced sleep, elevated heart rate, low activity, and high stress had rarely appeared together in Emily's history.",
  contributions: [
    { metric: "Resting heart rate", percent: 31 },
    { metric: "Sleep deviation", percent: 28 },
    { metric: "Activity reduction", percent: 24 },
    { metric: "Stress increase", percent: 17 },
  ],
  thresholdFlags: [
    { metric: "Sleep", flagged: true },
    { metric: "Heart rate", flagged: false },
    { metric: "Steps", flagged: false },
    { metric: "Stress", flagged: false },
  ],
};

const recommendations: Recommendation[] = [
  {
    title: "Move workouts earlier",
    evidence:
      "Afternoon workouts were associated with 38 additional minutes of sleep compared with late-evening workouts.",
    confidence: 94,
    observations: 26,
    whyItMatters:
      "Timing may influence recovery and sleep duration without requiring dramatic lifestyle changes.",
    action: "Schedule workouts before 5 PM when possible.",
  },
  {
    title: "Create an earlier caffeine cutoff",
    evidence:
      "Caffeine consumed after 3 PM was associated with a 9-point reduction in sleep quality.",
    confidence: 91,
    observations: 41,
    whyItMatters:
      "Small timing shifts in caffeine intake may improve next-night sleep quality.",
    action: "Try avoiding caffeine after 2 PM for two weeks.",
  },
  {
    title: "Watch for sustained baseline changes",
    evidence:
      "Resting heart rate has remained above Emily's normal range for four consecutive days.",
    confidence: 87,
    observations: 4,
    whyItMatters:
      "Sustained deviations from personal baseline can signal recovery needs before symptoms worsen.",
    action: "Prioritize recovery and continue monitoring the trend.",
  },
];

const evaluation: EvaluationMetrics = {
  rollingZScore: { precision: 0.61, recall: 0.57, f1: 0.59, prAuc: 0.62 },
  isolationForest: { precision: 0.86, recall: 0.81, f1: 0.83, prAuc: 0.88 },
  correlationDiscovery: {
    planted: 8,
    recovered: 7,
    falseDiscoveries: 1,
    precision: 0.875,
    recall: 0.875,
  },
  insightRelevance: {
    actionability: 4.5,
    specificity: 4.3,
    statisticalSupport: 4.6,
    personalization: 4.4,
    clarity: 4.2,
    average: 4.4,
  },
};

export const emilyData: EmilyDataset = {
  profile,
  records,
  baselines,
  correlations,
  pattern,
  anomaly,
  recommendations,
  evaluation,
  weeklyHeatmap: buildWeeklyHeatmap(records),
  autocorrelation: buildAutocorrelation(),
};

export function getSampleTableRows(count = 5) {
  return emilyData.records
    .filter((r) => !Number.isNaN(r.sleepDuration))
    .slice(10, 10 + count);
}

export function getBaselineChartData() {
  const valid = emilyData.records.filter((r) => !Number.isNaN(r.restingHr));
  const window = 30;
  return valid.map((r, i) => {
    const slice = valid.slice(Math.max(0, i - window + 1), i + 1);
    const rolling =
      slice.reduce((s, x) => s + x.restingHr, 0) / slice.length;
    const std =
      Math.sqrt(
        slice.reduce((s, x) => s + (x.restingHr - rolling) ** 2, 0) /
          slice.length,
      ) || 3;
    return {
      date: r.date.slice(5),
      value: r.restingHr,
      rolling: +rolling.toFixed(1),
      upper: +(rolling + std).toFixed(1),
      lower: +(rolling - std).toFixed(1),
    };
  });
}

export function getAnomalyTimelineData() {
  return emilyData.records
    .filter((r) => !Number.isNaN(r.energy))
    .map((r, i) => ({
      date: r.date.slice(5),
      score: r.isAnomaly ? 0.97 : 0.15 + ((i * 17) % 25) / 100,
      isAnomaly: r.isAnomaly,
      fullDate: r.date,
    }));
}

export function getDashboardCorrelationMatrix() {
  const metrics = ["Sleep", "RHR", "Steps", "Stress", "Caffeine", "Energy", "Workout"];
  const matrix: { x: string; y: string; value: number }[] = [];
  const vals = [
    [1, -0.62, 0.18, -0.35, -0.28, 0.52, -0.38],
    [-0.62, 1, -0.12, 0.41, 0.22, -0.48, 0.15],
    [0.18, -0.12, 1, -0.25, -0.08, 0.35, -0.12],
    [-0.35, 0.41, -0.25, 1, 0.38, -0.55, 0.20],
    [-0.28, 0.22, -0.08, 0.38, 1, -0.42, 0.45],
    [0.52, -0.48, 0.35, -0.55, -0.42, 1, -0.32],
    [-0.38, 0.15, -0.12, 0.20, 0.45, -0.32, 1],
  ];
  metrics.forEach((x, i) =>
    metrics.forEach((y, j) => matrix.push({ x, y, value: vals[i][j] })),
  );
  return { metrics, matrix };
}
