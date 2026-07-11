"""Lagged pairwise correlation discovery."""

from __future__ import annotations

from typing import List, Optional, Sequence, Tuple

import numpy as np
import pandas as pd
from scipy import stats

from health_engine.models import CorrelationFinding, MetricName


def _pearson_with_p(x: np.ndarray, y: np.ndarray) -> Tuple[float, float]:
    if len(x) < 8:
        return float("nan"), 1.0
    r, p = stats.pearsonr(x, y)
    return float(r), float(p)


def _spearman_with_p(x: np.ndarray, y: np.ndarray) -> Tuple[float, float]:
    if len(x) < 8:
        return float("nan"), 1.0
    r, p = stats.spearmanr(x, y)
    return float(r), float(p)


def lagged_cross_correlation(
    x: pd.Series,
    y: pd.Series,
    *,
    max_lag: int = 7,
    method: str = "pearson",
) -> List[Tuple[int, float, float]]:
    """
    Compute correlation of x[t] with y[t+lag] for lag in [-max_lag, max_lag].

    Positive lag means y follows x (x leads y).
    """
    corr_fn = _pearson_with_p if method == "pearson" else _spearman_with_p
    results: List[Tuple[int, float, float]] = []
    aligned = pd.concat([x.rename("x"), y.rename("y")], axis=1).dropna()
    if aligned.empty:
        return results

    for lag in range(-max_lag, max_lag + 1):
        if lag == 0:
            a, b = aligned["x"].values, aligned["y"].values
        elif lag > 0:
            a = aligned["x"].iloc[:-lag].values
            b = aligned["y"].iloc[lag:].values
        else:
            k = -lag
            a = aligned["x"].iloc[k:].values
            b = aligned["y"].iloc[:-k].values
        r, p = corr_fn(a, b)
        if np.isnan(r):
            continue
        results.append((lag, r, p))
    return results


def best_lagged_correlation(
    x: pd.Series,
    y: pd.Series,
    *,
    max_lag: int = 7,
    method: str = "pearson",
) -> Optional[Tuple[int, float, float]]:
    """Return the lag with largest |r|."""
    results = lagged_cross_correlation(x, y, max_lag=max_lag, method=method)
    if not results:
        return None
    return max(results, key=lambda t: abs(t[1]))


def benjamini_hochberg(p_values: Sequence[float], alpha: float = 0.05) -> List[bool]:
    """FDR correction; returns significance mask aligned to input order."""
    n = len(p_values)
    if n == 0:
        return []
    order = np.argsort(p_values)
    ranked = np.asarray(p_values)[order]
    thresh = alpha * (np.arange(1, n + 1) / n)
    below = ranked <= thresh
    if not below.any():
        return [False] * n
    max_k = int(np.max(np.where(below)[0]))
    significant = np.zeros(n, dtype=bool)
    significant[order[: max_k + 1]] = True
    return significant.tolist()


def discover_lagged_correlations(
    frame: pd.DataFrame,
    *,
    max_lag: int = 7,
    method: str = "pearson",
    alpha: float = 0.05,
    min_abs_r: float = 0.15,
) -> List[CorrelationFinding]:
    """Pairwise best-lag correlations with FDR correction."""
    cols = [c for c in frame.columns if c in {m.value for m in MetricName}]
    raw: List[CorrelationFinding] = []

    for i, a in enumerate(cols):
        for b in cols[i + 1 :]:
            best = best_lagged_correlation(
                frame[a], frame[b], max_lag=max_lag, method=method
            )
            if best is None:
                continue
            lag, r, p = best
            if abs(r) < min_abs_r:
                continue
            raw.append(
                CorrelationFinding(
                    metric_a=MetricName(a),
                    metric_b=MetricName(b),
                    lag_days=int(lag),
                    strength=float(r),
                    p_value=float(p),
                    method=method,
                    partial=False,
                    directed=lag != 0,
                    significant=False,
                )
            )

    sig = benjamini_hochberg([f.p_value for f in raw], alpha=alpha)
    findings = [
        f.model_copy(update={"significant": bool(s and f.p_value < alpha)})
        for f, s in zip(raw, sig)
    ]
    findings.sort(key=lambda f: abs(f.strength), reverse=True)
    return findings
