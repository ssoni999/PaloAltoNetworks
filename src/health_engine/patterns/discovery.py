"""Unlabeled recurring pattern discovery (event → outcome)."""

from __future__ import annotations

from typing import Dict, List, Optional

import numpy as np
import pandas as pd
from scipy import stats

from health_engine.models import PatternFinding
from health_engine.patterns.periodicity import estimate_periods


def _cohens_d(a: np.ndarray, b: np.ndarray) -> float:
    a = a[~np.isnan(a)]
    b = b[~np.isnan(b)]
    if len(a) < 3 or len(b) < 3:
        return 0.0
    var_a, var_b = np.var(a, ddof=1), np.var(b, ddof=1)
    n_a, n_b = len(a), len(b)
    pooled = np.sqrt(((n_a - 1) * var_a + (n_b - 1) * var_b) / max(n_a + n_b - 2, 1))
    if pooled < 1e-12:
        return 0.0
    return float((np.mean(a) - np.mean(b)) / pooled)


def afternoon_workout_sleep_pattern(frame: pd.DataFrame) -> Optional[PatternFinding]:
    """Afternoon workouts (hour >= 14) vs next-night sleep duration."""
    need = {"workout_hour", "workout_minutes", "sleep_duration"}
    if not need.issubset(frame.columns):
        return None

    workout_day = frame["workout_minutes"].fillna(0) > 15
    afternoon = workout_day & (frame["workout_hour"] >= 14)
    morning = workout_day & (frame["workout_hour"] < 12)

    # Next-night sleep
    next_sleep = frame["sleep_duration"].shift(-1)
    a = next_sleep[afternoon].dropna().values
    b = next_sleep[morning].dropna().values
    if len(a) < 5 or len(b) < 5:
        # fallback: afternoon vs non-afternoon workout days
        b = next_sleep[workout_day & ~afternoon].dropna().values
    if len(a) < 5 or len(b) < 5:
        return None

    d = _cohens_d(a, b)
    # Welch t-test
    t_stat, p = stats.ttest_ind(a, b, equal_var=False)
    return PatternFinding(
        condition="afternoon_workout",
        outcome="sleep_duration",
        period_hint_days=7.0,
        effect_size=float(d),
        support=int(len(a)),
        p_value=float(p),
        significant=bool(p < 0.05 and abs(d) > 0.25),
    )


def high_steps_hrv_pattern(frame: pd.DataFrame) -> Optional[PatternFinding]:
    """High-step days associate with higher same-day HRV."""
    if "steps" not in frame.columns or "hrv" not in frame.columns:
        return None
    steps = frame["steps"]
    thresh = steps.quantile(0.7)
    high = frame.loc[steps >= thresh, "hrv"].dropna().values
    low = frame.loc[steps < steps.quantile(0.3), "hrv"].dropna().values
    if len(high) < 8 or len(low) < 8:
        return None
    d = _cohens_d(high, low)
    _, p = stats.ttest_ind(high, low, equal_var=False)
    return PatternFinding(
        condition="high_steps",
        outcome="hrv",
        period_hint_days=None,
        effect_size=float(d),
        support=int(len(high)),
        p_value=float(p),
        significant=bool(p < 0.05 and abs(d) > 0.2),
    )


def sleep_resting_hr_pattern(frame: pd.DataFrame) -> Optional[PatternFinding]:
    """Short sleep nights associate with higher next-morning resting HR."""
    if "sleep_duration" not in frame.columns or "resting_hr" not in frame.columns:
        return None
    sleep = frame["sleep_duration"]
    short = sleep <= sleep.quantile(0.25)
    long = sleep >= sleep.quantile(0.75)
    a = frame.loc[short, "resting_hr"].dropna().values
    b = frame.loc[long, "resting_hr"].dropna().values
    if len(a) < 8 or len(b) < 8:
        return None
    d = _cohens_d(a, b)
    _, p = stats.ttest_ind(a, b, equal_var=False)
    return PatternFinding(
        condition="short_sleep",
        outcome="resting_hr",
        period_hint_days=None,
        effect_size=float(d),
        support=int(len(a)),
        p_value=float(p),
        significant=bool(p < 0.05 and abs(d) > 0.2),
    )


def discover_patterns(frame: pd.DataFrame) -> List[PatternFinding]:
    """Run pattern detectors and attach periodicity hints where useful."""
    periods = estimate_periods(frame)
    findings: List[PatternFinding] = []
    for fn in (
        afternoon_workout_sleep_pattern,
        high_steps_hrv_pattern,
        sleep_resting_hr_pattern,
    ):
        f = fn(frame)
        if f is None:
            continue
        # Enrich period hint from outcome series if missing
        if f.period_hint_days is None and f.outcome in periods:
            f = f.model_copy(
                update={"period_hint_days": periods[f.outcome].get("period_hint")}
            )
        findings.append(f)

    findings.sort(key=lambda p: abs(p.effect_size) * (1.0 if p.significant else 0.5), reverse=True)
    return findings


def period_summary(frame: pd.DataFrame) -> Dict[str, Dict[str, float]]:
    return estimate_periods(frame)
