/** Types matching the FastAPI AnalysisResult / EvaluateResponse. */

export type MetricName =
  | "sleep_duration"
  | "resting_hr"
  | "workout_minutes"
  | "workout_hour"
  | "steps"
  | "hrv";

export interface CorrelationFinding {
  metric_a: MetricName;
  metric_b: MetricName;
  lag_days: number;
  strength: number;
  p_value: number;
  method: string;
  partial: boolean;
  directed: boolean;
  significant: boolean;
}

export interface AnomalyEvent {
  timestamp: string;
  score: number;
  contributing_metrics: MetricName[];
  explanation: string;
  univariate_ok: boolean;
}

export interface PatternFinding {
  condition: string;
  outcome: string;
  period_hint_days: number | null;
  effect_size: number;
  support: number;
  p_value: number;
  significant: boolean;
}

export interface Insight {
  text: string;
  score: number;
  kind: string;
  evidence: Record<string, unknown>;
}

export interface DayAnomalyScore {
  date: string;
  iso_score: number;
  mahalanobis: number;
  combined_score: number;
  flagged: boolean;
  iso_outlier: boolean;
  z_scores: Record<string, number>;
  univariate_flags: Record<string, boolean>;
  feature_vector: Record<string, number>;
  contributing_metrics: MetricName[];
}

export interface AnomalyDiagnostics {
  timeline: DayAnomalyScore[];
  feature_names: string[];
  contamination: number;
  iso_p95: number;
  mahalanobis_p90: number;
  mahalanobis_p75: number;
  top_anomaly: DayAnomalyScore | null;
  formulas: Record<string, string>;
}

export interface DailySeriesPoint {
  date: string;
  values: Record<string, number | null>;
}

export interface AnalysisResult {
  correlations: CorrelationFinding[];
  anomalies: AnomalyEvent[];
  patterns: PatternFinding[];
  insights: Insight[];
  user_id: string;
  diagnostics: AnomalyDiagnostics | null;
  daily_series: DailySeriesPoint[];
}

export interface AnalyzeResponse {
  result: AnalysisResult;
  meta: Record<string, unknown>;
}

export interface EvalMetrics {
  anomaly_precision: number;
  anomaly_recall: number;
  anomaly_f1: number;
  correlation_recovery: number;
  correlation_mean_abs_r: number;
  correlation_fdr: number;
  insight_precision_at_k: number;
  insight_relevance_score: number;
  details: Record<string, unknown>;
}

export interface EvaluateResponse {
  metrics: EvalMetrics;
  insight_count: number;
  anomaly_count: number;
  correlation_count: number;
  pattern_count: number;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  reply: string;
  model: string;
  context_preview: string;
}

export const METRIC_LABELS: Record<string, string> = {
  sleep_duration: "Sleep Duration",
  resting_hr: "Resting HR",
  workout_minutes: "Workout Minutes",
  workout_hour: "Workout Hour",
  steps: "Steps",
  hrv: "HRV",
};

export function formatMetric(name: string): string {
  return METRIC_LABELS[name] ?? name.replace(/_/g, " ");
}

export function formatPValue(value: number): string {
  if (value < 0.001) return "<0.001";
  return value.toFixed(3);
}
