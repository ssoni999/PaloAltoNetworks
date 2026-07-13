"""Partial correlation and soft Granger-style directed evidence."""

from __future__ import annotations

import contextlib
import io
from typing import List, Optional, Sequence

import numpy as np
import pandas as pd
from scipy import stats

from health_engine.models import CorrelationFinding, MetricName

from health_engine.correlation.lagged import _signed_lagged_pearson

try:
    from statsmodels.tsa.stattools import grangercausalitytests
except ImportError:  # pragma: no cover
    grangercausalitytests = None


def _partial_corr(
    frame: pd.DataFrame,
    a: str,
    b: str,
    controls: Sequence[str],
) -> Optional[tuple]:
    """Partial correlation of a,b controlling for `controls` via residualization."""
    cols = [a, b, *controls]
    sub = frame[cols].dropna()
    if len(sub) < 12:
        return None
    if not controls:
        r, p = stats.pearsonr(sub[a], sub[b])
        return float(r), float(p)

    x = sub[list(controls)].values
    # Add intercept
    x = np.column_stack([np.ones(len(x)), x])
    ya = sub[a].values
    yb = sub[b].values
    beta_a, _, _, _ = np.linalg.lstsq(x, ya, rcond=None)
    beta_b, _, _, _ = np.linalg.lstsq(x, yb, rcond=None)
    ra = ya - x @ beta_a
    rb = yb - x @ beta_b
    if np.std(ra) < 1e-12 or np.std(rb) < 1e-12:
        return None
    r, p = stats.pearsonr(ra, rb)
    return float(r), float(p)


def discover_partial_correlations(
    frame: pd.DataFrame,
    *,
    control_metrics: Optional[Sequence[str]] = None,
    alpha: float = 0.05,
    min_abs_r: float = 0.12,
) -> List[CorrelationFinding]:
    """
    Pairwise partial correlations.

    Default controls: steps (common activity confounder) when present.
    """
    cols = [c for c in frame.columns if c in {m.value for m in MetricName}]
    default_controls = [c for c in (control_metrics or ["steps"]) if c in cols]
    findings: List[CorrelationFinding] = []

    for i, a in enumerate(cols):
        for b in cols[i + 1 :]:
            controls = [c for c in default_controls if c not in (a, b)]
            result = _partial_corr(frame, a, b, controls)
            if result is None:
                continue
            r, p = result
            if abs(r) < min_abs_r:
                continue
            findings.append(
                CorrelationFinding(
                    metric_a=MetricName(a),
                    metric_b=MetricName(b),
                    lag_days=0,
                    strength=float(r),
                    p_value=float(p),
                    method="partial_pearson",
                    partial=True,
                    directed=False,
                    significant=bool(p < alpha),
                )
            )

    findings.sort(key=lambda f: abs(f.strength), reverse=True)
    return findings


def granger_soft_evidence(
    frame: pd.DataFrame,
    cause: str,
    effect: str,
    *,
    max_lag: int = 3,
    alpha: float = 0.05,
) -> Optional[CorrelationFinding]:
    """
    Soft directed evidence via Granger causality (not causal proof).

    Returns a CorrelationFinding if the best lag is significant.
    """
    if grangercausalitytests is None:
        return None
    if cause not in frame.columns or effect not in frame.columns:
        return None
    sub = frame[[effect, cause]].dropna()
    if len(sub) < 30:
        return None
    try:
        # statsmodels expects [effect, cause] columns for testing cause -> effect.
        # Newer versions print by default; silence stdout.
        with contextlib.redirect_stdout(io.StringIO()):
            results = grangercausalitytests(sub[[effect, cause]], maxlag=max_lag)
    except Exception:
        return None

    best_lag = None
    best_p = 1.0
    best_r = 0.0
    for lag, res in results.items():
        lag_i = int(lag)
        if lag_i < 1:
            continue
        # ssr_ftest: (F, p, df_denom, df_num)
        f_stat, p_val, _, _ = res[0]["ssr_ftest"]
        signed = _signed_lagged_pearson(frame, cause, effect, lag_i)
        if signed is None:
            continue
        r, _ = signed
        if p_val < alpha and abs(r) >= abs(best_r):
            best_p = float(p_val)
            best_lag = lag_i
            best_r = float(r)

    if best_lag is None or best_p >= alpha:
        return None

    return CorrelationFinding(
        metric_a=MetricName(cause),
        metric_b=MetricName(effect),
        lag_days=best_lag,
        strength=best_r,
        p_value=best_p,
        method="granger",
        partial=False,
        directed=True,
        significant=True,
    )


def discover_directed_links(
    frame: pd.DataFrame,
    candidate_pairs: Optional[Sequence[tuple]] = None,
    *,
    max_lag: int = 3,
) -> List[CorrelationFinding]:
    """Run Granger soft tests on candidate directed pairs."""
    defaults = [
        ("workout_minutes", "sleep_duration"),
        ("sleep_duration", "resting_hr"),
        ("caffeine", "sleep_duration"),
        ("steps", "hrv"),
        ("workout_minutes", "resting_hr"),
        ("screen_time_before_bed", "hrv"),
        ("alcohol_units", "sleep_duration"),
        ("outdoor_minutes", "sleep_duration"),
    ]
    pairs = list(candidate_pairs or defaults)
    out: List[CorrelationFinding] = []
    for cause, effect in pairs:
        finding = granger_soft_evidence(frame, cause, effect, max_lag=max_lag)
        if finding is not None:
            out.append(finding)
    return out
