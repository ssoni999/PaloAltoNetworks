"""Multivariate anomaly detection (Isolation Forest + Mahalanobis)."""

from __future__ import annotations

from datetime import datetime
from typing import List, Optional, Sequence

import numpy as np
import pandas as pd
from sklearn.covariance import MinCovDet
from sklearn.ensemble import IsolationForest

from health_engine.anomaly.baseline import (
    CORE_METRICS,
    build_baseline_features,
    univariate_in_range,
)
from health_engine.models import AnomalyEvent, MetricName


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


def detect_anomalies(
    frame: pd.DataFrame,
    *,
    contamination: float = 0.05,
    min_periods: int = 14,
    random_state: int = 42,
    metrics: Optional[Sequence[str]] = None,
) -> List[AnomalyEvent]:
    """
    Detect multivariate anomalies using Isolation Forest, confirmed by Mahalanobis.

    A day is flagged when Isolation Forest labels it as outlier AND its Mahalanobis
    distance is above the 90th percentile of the series (holistic check).
    """
    features = build_baseline_features(frame, metrics=metrics, min_periods=min_periods)
    clean = features.dropna()
    if len(clean) < 30:
        return []

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

    events: List[AnomalyEvent] = []
    iso_p95 = float(np.percentile(iso_scores, 95))
    maha_p75 = float(np.percentile(maha, 75)) if len(maha) else 0.0
    for i, idx in enumerate(clean.index):
        if iso_labels[i] != -1:
            continue
        # Require Isolation Forest outlier plus elevated Mahalanobis,
        # or a very strong IF score with at least moderate Mahalanobis.
        strong = maha[i] >= maha_thresh
        very_strong_if = iso_scores[i] >= iso_p95 and maha[i] >= maha_p75
        if not (strong or very_strong_if):
            continue

        contrib = _contributing_metrics(clean, idx)
        uni_ok = univariate_in_range(frame, idx, metrics=metrics or CORE_METRICS)
        score = float(0.6 * iso_scores[i] + 0.4 * (maha[i] / (maha_thresh + 1e-9)))
        ts = idx.to_pydatetime() if hasattr(idx, "to_pydatetime") else datetime.fromisoformat(str(idx))
        metric_str = ", ".join(m.value for m in contrib) or "joint metrics"
        explanation = (
            f"Multivariate deviation on {ts.date()} driven by {metric_str}"
            + (" (each metric alone near baseline)" if uni_ok else "")
        )
        events.append(
            AnomalyEvent(
                timestamp=ts,
                score=score,
                contributing_metrics=contrib,
                explanation=explanation,
                univariate_ok=uni_ok,
            )
        )

    events.sort(key=lambda e: e.score, reverse=True)
    return events
