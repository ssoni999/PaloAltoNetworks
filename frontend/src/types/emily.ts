export interface DailyRecord {
  date: string;
  sleepDuration: number;
  sleepQuality: number;
  restingHr: number;
  steps: number;
  workoutMinutes: number;
  workoutIntensity: number;
  workoutHour: number | null;
  stress: number;
  caffeine: number;
  caffeineAfter3pm: boolean;
  mood: number;
  energy: number;
  isAnomaly: boolean;
  isIllnessPeriod: boolean;
  dayOfWeek: number;
}

export interface EmilyProfile {
  name: string;
  age: number;
  occupation: string;
  trackingPeriod: string;
  devices: string;
  mainConcern: string;
  avgSleep: number;
  avgRestingHr: number;
  avgSteps: number;
  avgStress: number;
}

export interface CorrelationInsight {
  id: string;
  title: string;
  correlation?: number;
  effectSize?: string;
  lag?: string;
  pValue?: number;
  confidence?: number;
  sampleSize: number;
  interpretation: string;
  chartData: { label: string; value: number }[];
  chartType: "bar" | "scatter";
}

export interface PatternInsight {
  name: string;
  periodDays: number;
  confidence: number;
  occurrences: number;
  sequence: string[];
  explanation: string;
}

export interface AnomalyDetail {
  date: string;
  score: number;
  deviations: {
    metric: string;
    change: string;
    direction: "above" | "below";
  }[];
  explanation: string;
  contributions: { metric: string; percent: number }[];
  thresholdFlags: { metric: string; flagged: boolean }[];
}

export interface Recommendation {
  title: string;
  evidence: string;
  confidence: number;
  observations: number;
  whyItMatters: string;
  action: string;
}

export interface EvaluationMetrics {
  rollingZScore: { precision: number; recall: number; f1: number; prAuc: number };
  isolationForest: { precision: number; recall: number; f1: number; prAuc: number };
  correlationDiscovery: {
    planted: number;
    recovered: number;
    falseDiscoveries: number;
    precision: number;
    recall: number;
  };
  insightRelevance: {
    actionability: number;
    specificity: number;
    statisticalSupport: number;
    personalization: number;
    clarity: number;
    average: number;
  };
}

export interface EmilyDataset {
  profile: EmilyProfile;
  records: DailyRecord[];
  baselines: {
    sleep: number;
    restingHr: number;
    steps: number;
  };
  correlations: CorrelationInsight[];
  pattern: PatternInsight;
  anomaly: AnomalyDetail;
  recommendations: Recommendation[];
  evaluation: EvaluationMetrics;
  weeklyHeatmap: { day: string; week: number; value: number }[];
  autocorrelation: { lag: number; value: number }[];
}
