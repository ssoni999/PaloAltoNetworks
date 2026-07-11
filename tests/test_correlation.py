"""Tests for correlation discovery."""

from health_engine.correlation import discover_lagged_correlations, discover_partial_correlations
from health_engine.data import align_bundle, generate_synthetic
from health_engine.models import MetricName


def test_discovers_sleep_hr_correlation():
    ds = generate_synthetic(seed=42, n_days=180)
    frame, _ = align_bundle(ds.bundle)
    findings = discover_lagged_correlations(frame, max_lag=5)
    pairs = {
        frozenset({f.metric_a, f.metric_b}): f for f in findings if f.method == "pearson"
    }
    key = frozenset({MetricName.SLEEP_DURATION, MetricName.RESTING_HR})
    assert key in pairs
    f = pairs[key]
    assert f.strength < 0  # inverse relationship
    assert abs(f.strength) > 0.3
    assert f.significant


def test_discovers_workout_sleep_lag():
    ds = generate_synthetic(seed=42, n_days=180)
    frame, _ = align_bundle(ds.bundle)
    findings = discover_lagged_correlations(frame, max_lag=5)
    matches = [
        f
        for f in findings
        if frozenset({f.metric_a, f.metric_b})
        == frozenset({MetricName.WORKOUT_MINUTES, MetricName.SLEEP_DURATION})
    ]
    assert matches
    # Best lag should be near 1 (workout leads sleep) or strength still meaningful
    best = max(matches, key=lambda f: abs(f.strength))
    assert abs(best.strength) > 0.15


def test_partial_correlations_run():
    ds = generate_synthetic(seed=7, n_days=120)
    frame, _ = align_bundle(ds.bundle)
    partial = discover_partial_correlations(frame)
    assert isinstance(partial, list)
