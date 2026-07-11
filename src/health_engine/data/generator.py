"""Synthetic multi-stream health data with planted ground truth."""

from __future__ import annotations

from datetime import date, datetime, timedelta
from typing import List, Optional, Tuple

import numpy as np

from health_engine.models import (
    GroundTruth,
    MetricName,
    MetricSeries,
    PlantedAnomaly,
    PlantedCorrelation,
    PlantedPattern,
    SyntheticDataset,
    TimeSeriesBundle,
)


def _dates(start: date, n_days: int) -> List[date]:
    return [start + timedelta(days=i) for i in range(n_days)]


def _to_dt(d: date, hour: int = 8) -> datetime:
    return datetime(d.year, d.month, d.day, hour, 0, 0)


def generate_synthetic(
    *,
    user_id: str = "user_demo",
    n_days: int = 180,
    seed: int = 42,
    start: Optional[date] = None,
    missing_rate: float = 0.05,
) -> SyntheticDataset:
    """
    Generate fragmented daily health streams with planted relationships:

    Planted correlations
    --------------------
    1. sleep_duration[t]  <->  resting_hr[t]     (negative, lag 0)
    2. workout_minutes[t] -> sleep_duration[t+1] (positive, lag 1)
    3. steps[t]           <->  hrv[t]            (positive, lag 0)

    Planted pattern
    ---------------
    Afternoon workouts (workout_hour >= 14) associate with better next-night sleep.

    Planted anomalies
    -----------------
    Several days where the *joint* (low sleep + high HR + low HRV) is rare,
    even if each metric alone can appear in-range occasionally.
    """
    rng = np.random.default_rng(seed)
    start = start or date(2024, 1, 1)
    days = _dates(start, n_days)
    t = np.arange(n_days)

    # Base signals with weekly periodicity (7-day)
    weekly = np.sin(2 * np.pi * t / 7.0)

    # --- Core drivers ---
    # Workout minutes: higher on some weekdays, afternoon bias planted later
    workout_minutes = np.clip(
        25 + 20 * weekly + rng.normal(0, 12, n_days), 0, 120
    )
    # Afternoon vs morning: ~55% afternoon on workout days
    is_workout = workout_minutes > 15
    workout_hour = np.where(
        is_workout,
        np.where(rng.random(n_days) < 0.55, rng.uniform(14, 19, n_days), rng.uniform(6, 11, n_days)),
        np.nan,
    )

    # Steps correlated with workout + noise
    steps = np.clip(
        7000 + 40 * workout_minutes + 800 * weekly + rng.normal(0, 900, n_days),
        1500,
        25000,
    )

    # Sleep: base + lag-1 effect from workout + afternoon bonus + noise
    sleep = 7.0 + 0.25 * weekly + rng.normal(0, 0.35, n_days)
    sleep[1:] += 0.012 * workout_minutes[:-1]  # planted lag-1 positive
    # Afternoon workout → better next-night sleep (~+0.7h)
    afternoon = (workout_hour >= 14) & is_workout
    for i in range(n_days - 1):
        if afternoon[i]:
            sleep[i + 1] += 0.7
    sleep = np.clip(sleep, 4.0, 10.0)

    # Resting HR: inversely related to sleep (lag 0) + noise
    resting_hr = 62 - 2.2 * (sleep - 7.0) + rng.normal(0, 1.8, n_days)
    resting_hr = np.clip(resting_hr, 45, 95)

    # HRV: positively related to steps (lag 0) and sleep
    hrv = 45 + 0.0015 * (steps - 7000) + 3.0 * (sleep - 7.0) + rng.normal(0, 4.0, n_days)
    hrv = np.clip(hrv, 15, 120)

    # --- Plant multivariate anomalies ---
    # Pick days in the latter half so baselines are established
    start_i = min(max(14, n_days // 3), max(n_days - 5, 0))
    end_i = max(n_days - 2, start_i + 1)
    candidate_idx = list(range(start_i, end_i))
    planted_anomalies: List[PlantedAnomaly] = []
    if candidate_idx:
        n_anom = min(len(candidate_idx), max(1, n_days // 40))
        anom_idx = sorted(
            rng.choice(candidate_idx, size=n_anom, replace=False).tolist()
        )
    else:
        anom_idx = []
    for i in anom_idx:
        # Joint rare combo: short sleep + elevated HR + depressed HRV
        sleep[i] = float(rng.uniform(4.2, 5.0))
        resting_hr[i] = float(rng.uniform(78, 88))
        hrv[i] = float(rng.uniform(18, 28))
        # Keep workout/steps near normal so univariate thresholds alone are weak
        planted_anomalies.append(
            PlantedAnomaly(
                day=days[i],
                metrics=[MetricName.SLEEP_DURATION, MetricName.RESTING_HR, MetricName.HRV],
            )
        )

    def maybe_drop(values: np.ndarray, timestamps: List[datetime]) -> Tuple[List[datetime], List[float]]:
        keep_t: List[datetime] = []
        keep_v: List[float] = []
        for ts, v in zip(timestamps, values):
            if np.isnan(v):
                continue
            if rng.random() < missing_rate:
                continue
            keep_t.append(ts)
            keep_v.append(float(v))
        return keep_t, keep_v

    # Slightly different observation times to simulate fragmentation
    sleep_ts = [_to_dt(d, 7) for d in days]
    hr_ts = [_to_dt(d, 9) for d in days]
    workout_ts = [_to_dt(d, 18) for d in days]
    hour_ts = [_to_dt(d, 18) for d in days]
    steps_ts = [_to_dt(d, 22) for d in days]
    hrv_ts = [_to_dt(d, 8) for d in days]

    series_list: List[MetricSeries] = []
    for name, vals, tss in [
        (MetricName.SLEEP_DURATION, sleep, sleep_ts),
        (MetricName.RESTING_HR, resting_hr, hr_ts),
        (MetricName.WORKOUT_MINUTES, workout_minutes, workout_ts),
        (MetricName.WORKOUT_HOUR, workout_hour, hour_ts),
        (MetricName.STEPS, steps, steps_ts),
        (MetricName.HRV, hrv, hrv_ts),
    ]:
        kt, kv = maybe_drop(vals, tss)
        series_list.append(
            MetricSeries(user_id=user_id, metric_name=name, timestamps=kt, values=kv)
        )

    ground_truth = GroundTruth(
        correlations=[
            PlantedCorrelation(
                metric_a=MetricName.SLEEP_DURATION,
                metric_b=MetricName.RESTING_HR,
                lag_days=0,
                strength=-0.6,
            ),
            PlantedCorrelation(
                metric_a=MetricName.WORKOUT_MINUTES,
                metric_b=MetricName.SLEEP_DURATION,
                lag_days=1,
                strength=0.4,
            ),
            PlantedCorrelation(
                metric_a=MetricName.STEPS,
                metric_b=MetricName.HRV,
                lag_days=0,
                strength=0.35,
            ),
        ],
        anomalies=planted_anomalies,
        patterns=[
            PlantedPattern(
                condition="afternoon_workout",
                outcome="sleep_duration",
                effect_direction="positive",
            ),
        ],
    )

    bundle = TimeSeriesBundle(user_id=user_id, series=series_list)
    return SyntheticDataset(
        bundle=bundle,
        ground_truth=ground_truth,
        seed=seed,
        n_days=n_days,
    )
