"""Rank findings into actionable natural-language insights."""

from __future__ import annotations

from typing import List, Sequence

from health_engine.models import (
    AnomalyEvent,
    CorrelationFinding,
    Insight,
    PatternFinding,
)

# Pairs that are especially actionable for wellness coaching
ACTIONABLE_PAIRS = {
    frozenset({"sleep_duration", "resting_hr"}),
    frozenset({"workout_minutes", "sleep_duration"}),
    frozenset({"steps", "hrv"}),
    frozenset({"sleep_duration", "hrv"}),
    frozenset({"workout_minutes", "resting_hr"}),
}


def _corr_actionability(f: CorrelationFinding) -> float:
    pair = frozenset({f.metric_a.value, f.metric_b.value})
    base = 1.2 if pair in ACTIONABLE_PAIRS else 0.8
    lag_bonus = 1.1 if 0 <= abs(f.lag_days) <= 2 else 0.7
    sig = 1.15 if f.significant else 0.85
    return base * lag_bonus * sig


def _correlation_insight(f: CorrelationFinding) -> Insight:
    direction = "positively" if f.strength > 0 else "inversely"
    lag_txt = (
        "same day"
        if f.lag_days == 0
        else f"{f.metric_a.value} leading {f.metric_b.value} by {f.lag_days} day(s)"
    )
    method = "partial " if f.partial else ""
    text = (
        f"{f.metric_a.value} and {f.metric_b.value} are {direction} related "
        f"({method}r={f.strength:.2f}, p={f.p_value:.3g}, {lag_txt})."
    )
    score = abs(f.strength) * (1.0 - min(f.p_value, 1.0)) * _corr_actionability(f)
    return Insight(
        text=text,
        score=float(score),
        kind="correlation",
        evidence=f.model_dump(mode="json"),
    )


def _anomaly_insight(e: AnomalyEvent) -> Insight:
    metrics = ", ".join(m.value for m in e.contributing_metrics) or "multiple metrics"
    text = (
        f"Unusual day on {e.timestamp.date()}: joint pattern in {metrics} "
        f"(score={e.score:.2f})"
        + ("; individual metrics near baseline" if e.univariate_ok else "")
        + "."
    )
    score = float(e.score) * (1.15 if e.univariate_ok else 1.0)
    return Insight(
        text=text,
        score=score,
        kind="anomaly",
        evidence=e.model_dump(mode="json"),
    )


def _pattern_insight(p: PatternFinding) -> Insight:
    direction = "higher" if p.effect_size > 0 else "lower"
    period = (
        f" Recurring ~{p.period_hint_days:.0f}-day rhythm noted."
        if p.period_hint_days
        else ""
    )
    friendly = {
        "afternoon_workout": "Afternoon workouts (after 2pm)",
        "high_steps": "High-step days",
        "short_sleep": "Short-sleep nights",
    }
    cond = friendly.get(p.condition, p.condition)
    text = (
        f"{cond} associate with {direction} {p.outcome} "
        f"(effect size d={p.effect_size:.2f}, n={p.support}, p={p.p_value:.3g})."
        f"{period}"
    )
    score = abs(p.effect_size) * (1.0 - min(p.p_value, 1.0)) * (1.2 if p.significant else 0.8)
    # Boost the flagship wellness insight
    if p.condition == "afternoon_workout":
        score *= 1.3
    return Insight(
        text=text,
        score=float(score),
        kind="pattern",
        evidence=p.model_dump(mode="json"),
    )


def rank_insights(
    correlations: Sequence[CorrelationFinding],
    anomalies: Sequence[AnomalyEvent],
    patterns: Sequence[PatternFinding],
    *,
    top_k: int = 10,
) -> List[Insight]:
    """Compose and rank insights by composite relevance score."""
    insights: List[Insight] = []
    for f in correlations:
        if abs(f.strength) < 0.15:
            continue
        insights.append(_correlation_insight(f))
    for e in anomalies[:15]:
        insights.append(_anomaly_insight(e))
    for p in patterns:
        insights.append(_pattern_insight(p))

    insights.sort(key=lambda i: i.score, reverse=True)
    return insights[:top_k]
