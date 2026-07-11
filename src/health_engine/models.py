"""Core domain models for the Health & Wellness Correlation Engine."""

from __future__ import annotations

from datetime import date, datetime
from enum import Enum
from typing import Any, Dict, List, Optional, Sequence, Tuple

from pydantic import BaseModel, Field


class MetricName(str, Enum):
    SLEEP_DURATION = "sleep_duration"
    RESTING_HR = "resting_hr"
    WORKOUT_MINUTES = "workout_minutes"
    WORKOUT_HOUR = "workout_hour"
    STEPS = "steps"
    HRV = "hrv"


METRIC_UNITS: Dict[MetricName, str] = {
    MetricName.SLEEP_DURATION: "hours",
    MetricName.RESTING_HR: "bpm",
    MetricName.WORKOUT_MINUTES: "minutes",
    MetricName.WORKOUT_HOUR: "hour_of_day",
    MetricName.STEPS: "count",
    MetricName.HRV: "ms",
}


class MetricSeries(BaseModel):
    """A single metric time series for one user."""

    user_id: str
    metric_name: MetricName
    timestamps: List[datetime]
    values: List[float]

    def __len__(self) -> int:
        return len(self.values)


class TimeSeriesBundle(BaseModel):
    """Collection of metric streams for a user (possibly misaligned)."""

    user_id: str
    series: List[MetricSeries] = Field(default_factory=list)

    def get(self, metric: MetricName) -> Optional[MetricSeries]:
        for s in self.series:
            if s.metric_name == metric:
                return s
        return None

    def metric_names(self) -> List[MetricName]:
        return [s.metric_name for s in self.series]


class CorrelationFinding(BaseModel):
    metric_a: MetricName
    metric_b: MetricName
    lag_days: int
    strength: float
    p_value: float
    method: str
    partial: bool = False
    directed: bool = False
    significant: bool = False


class AnomalyEvent(BaseModel):
    timestamp: datetime
    score: float
    contributing_metrics: List[MetricName]
    explanation: str
    univariate_ok: bool = True


class PatternFinding(BaseModel):
    condition: str
    outcome: str
    period_hint_days: Optional[float] = None
    effect_size: float
    support: int
    p_value: float
    significant: bool = False


class Insight(BaseModel):
    text: str
    score: float
    kind: str  # correlation | anomaly | pattern
    evidence: Dict[str, Any] = Field(default_factory=dict)


class PlantedCorrelation(BaseModel):
    metric_a: MetricName
    metric_b: MetricName
    lag_days: int
    strength: float


class PlantedAnomaly(BaseModel):
    day: date
    metrics: List[MetricName]


class PlantedPattern(BaseModel):
    condition: str
    outcome: str
    effect_direction: str  # positive | negative


class GroundTruth(BaseModel):
    correlations: List[PlantedCorrelation] = Field(default_factory=list)
    anomalies: List[PlantedAnomaly] = Field(default_factory=list)
    patterns: List[PlantedPattern] = Field(default_factory=list)


class SyntheticDataset(BaseModel):
    bundle: TimeSeriesBundle
    ground_truth: GroundTruth
    seed: int
    n_days: int


class AnalysisResult(BaseModel):
    correlations: List[CorrelationFinding]
    anomalies: List[AnomalyEvent]
    patterns: List[PatternFinding]
    insights: List[Insight]
    user_id: str


class EvalMetrics(BaseModel):
    anomaly_precision: float
    anomaly_recall: float
    anomaly_f1: float
    correlation_recovery: float
    correlation_mean_abs_r: float
    correlation_fdr: float
    insight_precision_at_k: float
    insight_relevance_score: float
    details: Dict[str, Any] = Field(default_factory=dict)


def pairwise_metric_names(names: Sequence[MetricName]) -> List[Tuple[MetricName, MetricName]]:
    out: List[Tuple[MetricName, MetricName]] = []
    for i, a in enumerate(names):
        for b in names[i + 1 :]:
            out.append((a, b))
    return out
