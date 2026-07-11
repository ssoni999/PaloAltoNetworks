"""Per-user baseline feature construction for anomaly detection."""

from __future__ import annotations

from typing import List, Optional, Sequence

import numpy as np
import pandas as pd

from health_engine.data.align import zscore_frame


CORE_METRICS: List[str] = [
    "sleep_duration",
    "resting_hr",
    "hrv",
    "workout_minutes",
    "steps",
]


def build_baseline_features(
    frame: pd.DataFrame,
    *,
    metrics: Optional[Sequence[str]] = None,
    min_periods: int = 14,
) -> pd.DataFrame:
    """
    Build a joint feature matrix for multivariate anomaly detection.

    Features:
    - expanding z-score of each core metric
    - simple interaction: sleep_z * resting_hr_z (captures joint stress)
    - sleep_z * (-hrv_z) (low sleep + low HRV)
    """
    cols = [c for c in (metrics or CORE_METRICS) if c in frame.columns]
    if not cols:
        return pd.DataFrame(index=frame.index)

    sub = frame[cols].copy()
    z = zscore_frame(sub, min_periods=min_periods)
    features = z.add_suffix("_z")

    if "sleep_duration_z" in features.columns and "resting_hr_z" in features.columns:
        features["sleep_hr_interaction"] = (
            features["sleep_duration_z"] * features["resting_hr_z"]
        )
    if "sleep_duration_z" in features.columns and "hrv_z" in features.columns:
        features["sleep_hrv_interaction"] = (
            features["sleep_duration_z"] * (-features["hrv_z"])
        )

    return features


def univariate_in_range(
    frame: pd.DataFrame,
    row_idx,
    *,
    z_thresh: float = 2.5,
    metrics: Optional[Sequence[str]] = None,
) -> bool:
    """True if no single metric exceeds |z| > z_thresh on that day."""
    cols = [c for c in (metrics or CORE_METRICS) if c in frame.columns]
    if not cols:
        return True
    z = zscore_frame(frame[cols], min_periods=14)
    if row_idx not in z.index:
        return True
    row = z.loc[row_idx]
    if row.isna().all():
        return True
    return bool(((row.abs() <= z_thresh) | row.isna()).all())
