"""Multivariate anomaly detection (Isolation Forest + Mahalanobis)."""

from __future__ import annotations

from datetime import datetime
from typing import List, Optional, Sequence, Tuple

import numpy as np
import pandas as pd
from sklearn.covariance import MinCovDet
from sklearn.ensemble import IsolationForest

from health_engine.anomaly.baseline import (
    CORE_METRICS,
    build_baseline_features,
    univariate_in_range,
)
from health_engine.data.align import zscore_frame
from health_engine.models import (
    AnomalyDiagnostics,
    AnomalyEvent,
    DayAnomalyScore,
    MetricName,
)


def _mahalanobis_scores(X: np.ndarray) -> np.ndarray:
    """Robust Mahalanobis distances; higher = more anomalous."""
    if len(X) < 20 or X.shape[1] < 2:
        return np.zeros(len(X))
    try:
        mcd = MinCovDet(random_state=42).fit(X)
        return mcd.mahalanobis(X)
    except Exception:
        # Fallback: classical covariance
        mean = np.nanmean(X, axis=0)
        cov = np.cov(X, rowvar=False)
        try:
            inv = np.linalg.pinv(cov)
        except np.linalg.LinAlgError:
            return np.zeros(len(X))
        diff = X - mean
        return np.einsum("ij,jk,ik->i", diff, inv, diff)


def _contributing_metrics(
    features: pd.DataFrame,
    idx,
    top_k: int = 3,
) -> List[MetricName]:
    row = features.loc[idx]
    # Prefer base z-score columns
    z_cols = [c for c in row.index if c.endswith("_z")]
    if not z_cols:
        z_cols = list(row.index)
    scores = row[z_cols].abs().sort_values(ascending=False)
    names: List[MetricName] = []
    for col in scores.index:
        base = col.replace("_z", "")
        if base in {m.value for m in MetricName}:
            names.append(MetricName(base))
        if len(names) >= top_k:
            break
    return names


def _univariate_flags(
    frame: pd.DataFrame,
    row_idx,
    *,
    z_thresh: float = 2.5,
    metrics: Optional[Sequence[str]] = None,
) -> dict:
    cols = [c for c in (metrics or CORE_METRICS) if c in frame.columns]
    if not cols or row_idx not in frame.index:
        return {}
    z = zscore_frame(frame[cols], min_periods=14)
    if row_idx not in z.index:
        return {}
    row = z.loc[row_idx]
    flags: dict = {}
    for col in cols:
        val = row.get(col)
        if val is None or (isinstance(val, float) and np.isnan(val)):
            flags[col] = False
        else:
            flags[col] = bool(abs(float(val)) > z_thresh)
    return flags


def _z_scores_for_row(
    frame: pd.DataFrame,
    row_idx,
    *,
    metrics: Optional[Sequence[str]] = None,
) -> dict:
    cols = [c for c in (metrics or CORE_METRICS) if c in frame.columns]
    if not cols or row_idx not in frame.index:
        return {}
    z = zscore_frame(frame[cols], min_periods=14)
    if row_idx not in z.index:
        return {}
    row = z.loc[row_idx]
    out: dict = {}
    for col in cols:
        val = row.get(col)
        if val is None or (isinstance(val, float) and np.isnan(val)):
            continue
        out[col] = float(val)
    return out


def detect_anomalies_with_diagnostics(
    frame: pd.DataFrame,
    *,
    contamination: float = 0.05,
    min_periods: int = 14,
    random_state: int = 42,
    metrics: Optional[Sequence[str]] = None,
) -> Tuple[List[AnomalyEvent], AnomalyDiagnostics]:
    """
    Run Isolation Forest + Mahalanobis and return events plus full diagnostics.

    A day is flagged when Isolation Forest labels it as outlier AND its Mahalanobis
    distance is above the 90th percentile of the series (holistic check), or when
    IF score is very strong (p95+) with at least moderate Mahalanobis (p75+).
    """
    metric_list = list(metrics or CORE_METRICS)
    features = build_baseline_features(
        frame, metrics=metric_list, min_periods=min_periods
    )
    clean = features.dropna()
    empty = AnomalyDiagnostics(
        contamination=contamination,
        feature_names=list(features.columns),
    )
    if len(clean) < 30:
        return [], empty

    X = clean.values.astype(float)
    iso = IsolationForest(
        contamination=contamination,
        random_state=random_state,
        n_estimators=200,
    )
    iso_labels = iso.fit_predict(X)  # -1 = anomaly
    iso_scores = -iso.score_samples(X)  # higher = more anomalous
    maha = _mahalanobis_scores(X)
    maha_thresh = float(np.percentile(maha, 90)) if len(maha) else 0.0
    iso_p95 = float(np.percentile(iso_scores, 95))
    maha_p75 = float(np.percentile(maha, 75)) if len(maha) else 0.0

    events: List[AnomalyEvent] = []
    timeline: List[DayAnomalyScore] = []
    feature_names = list(clean.columns)

    for i, idx in enumerate(clean.index):
        iso_outlier = bool(iso_labels[i] == -1)
        strong = maha[i] >= maha_thresh
        very_strong_if = iso_scores[i] >= iso_p95 and maha[i] >= maha_p75
        flagged = bool(iso_outlier and (strong or very_strong_if))
        combined = float(
            0.6 * iso_scores[i] + 0.4 * (maha[i] / (maha_thresh + 1e-9))
        )
        contrib = _contributing_metrics(clean, idx) if flagged else []
        uni_flags = _univariate_flags(frame, idx, metrics=metric_list)
        z_scores = _z_scores_for_row(frame, idx, metrics=metric_list)
        feat_vec = {
            name: float(clean.iloc[i][name]) for name in feature_names
        }
        day = idx.date() if hasattr(idx, "date") else datetime.fromisoformat(str(idx)).date()

        day_score = DayAnomalyScore(
            date=day,
            iso_score=float(iso_scores[i]),
            mahalanobis=float(maha[i]),
            combined_score=combined,
            flagged=flagged,
            iso_outlier=iso_outlier,
            z_scores=z_scores,
            univariate_flags=uni_flags,
            feature_vector=feat_vec,
            contributing_metrics=contrib,
        )
        timeline.append(day_score)

        if not flagged:
            continue

        uni_ok = univariate_in_range(frame, idx, metrics=metric_list)
        ts = (
            idx.to_pydatetime()
            if hasattr(idx, "to_pydatetime")
            else datetime.fromisoformat(str(idx))
        )
        metric_str = ", ".join(m.value for m in contrib) or "joint metrics"
        explanation = (
            f"Multivariate deviation on {ts.date()} driven by {metric_str}"
            + (" (each metric alone near baseline)" if uni_ok else "")
        )
        events.append(
            AnomalyEvent(
                timestamp=ts,
                score=combined,
                contributing_metrics=contrib,
                explanation=explanation,
                univariate_ok=uni_ok,
            )
        )

    events.sort(key=lambda e: e.score, reverse=True)
    flagged_days = [d for d in timeline if d.flagged]
    top = max(flagged_days, key=lambda d: d.combined_score) if flagged_days else None

    diagnostics = AnomalyDiagnostics(
        timeline=timeline,
        feature_names=feature_names,
        contamination=contamination,
        iso_p95=iso_p95,
        mahalanobis_p90=maha_thresh,
        mahalanobis_p75=maha_p75,
        top_anomaly=top,
    )
    return events, diagnostics


def detect_anomalies(
    frame: pd.DataFrame,
    *,
    contamination: float = 0.05,
    min_periods: int = 14,
    random_state: int = 42,
    metrics: Optional[Sequence[str]] = None,
) -> List[AnomalyEvent]:
    """Detect multivariate anomalies using Isolation Forest + Mahalanobis."""
    events, _ = detect_anomalies_with_diagnostics(
        frame,
        contamination=contamination,
        min_periods=min_periods,
        random_state=random_state,
        metrics=metrics,
    )
    return events
