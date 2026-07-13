"""Align fragmented metric streams onto a common daily grid."""

from __future__ import annotations

from datetime import datetime
from typing import Dict, List, Optional, Tuple

import numpy as np
import pandas as pd

from health_engine.models import MetricName, MetricSeries, TimeSeriesBundle


def _to_date_index(timestamps: List[datetime]) -> pd.DatetimeIndex:
    return pd.DatetimeIndex(pd.to_datetime(timestamps)).normalize()


def series_to_daily(
    series: MetricSeries,
    *,
    agg: str = "mean",
) -> pd.Series:
    """Collapse a metric series to one value per calendar day."""
    idx = _to_date_index(series.timestamps)
    s = pd.Series(series.values, index=idx, dtype=float)
    if agg == "sum":
        return s.groupby(level=0).sum()
    if agg == "max":
        return s.groupby(level=0).max()
    if agg == "last":
        return s.groupby(level=0).last()
    return s.groupby(level=0).mean()


AGG_BY_METRIC: Dict[MetricName, str] = {
    MetricName.SLEEP_DURATION: "mean",
    MetricName.RESTING_HR: "mean",
    MetricName.WORKOUT_MINUTES: "sum",
    MetricName.WORKOUT_HOUR: "last",
    MetricName.STEPS: "sum",
    MetricName.HRV: "mean",
    MetricName.CAFFEINE: "sum",
    MetricName.SCREEN_TIME_BEFORE_BED: "mean",
    MetricName.ALCOHOL_UNITS: "sum",
    MetricName.OUTDOOR_MINUTES: "sum",
}


def align_bundle(
    bundle: TimeSeriesBundle,
    *,
    freq: str = "D",
    fill_method: Optional[str] = None,
) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """
    Align all metrics in a bundle to a common daily index.

    Returns
    -------
    frame : DataFrame
        Columns are metric names, index is daily timestamps.
    mask : DataFrame
        True where the original value was observed (before fill).
    """
    if not bundle.series:
        empty = pd.DataFrame()
        return empty, empty

    daily: Dict[str, pd.Series] = {}
    for series in bundle.series:
        agg = AGG_BY_METRIC.get(series.metric_name, "mean")
        daily[series.metric_name.value] = series_to_daily(series, agg=agg)

    frame = pd.DataFrame(daily)
    if freq != "D":
        frame = frame.resample(freq).mean()

    full_idx = pd.date_range(frame.index.min(), frame.index.max(), freq="D")
    frame = frame.reindex(full_idx)
    mask = frame.notna()

    if fill_method == "ffill":
        frame = frame.ffill()
    elif fill_method == "bfill":
        frame = frame.bfill()

    frame.index.name = "date"
    mask.index = frame.index
    mask.index.name = "date"
    return frame, mask


def zscore_frame(frame: pd.DataFrame, min_periods: int = 14) -> pd.DataFrame:
    """Expanding z-score per column after warm-up."""
    mean = frame.expanding(min_periods=min_periods).mean()
    std = frame.expanding(min_periods=min_periods).std().replace(0, np.nan)
    return (frame - mean) / std
