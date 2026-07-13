"""Tests for synthetic data generation."""

from health_engine.data import align_bundle, generate_synthetic
from health_engine.models import MetricName


def test_generator_produces_all_metrics():
    ds = generate_synthetic(seed=42, n_days=90)
    names = set(ds.bundle.metric_names())
    assert MetricName.SLEEP_DURATION in names
    assert MetricName.RESTING_HR in names
    assert MetricName.WORKOUT_MINUTES in names
    assert MetricName.HRV in names
    assert MetricName.CAFFEINE in names
    assert MetricName.SCREEN_TIME_BEFORE_BED in names
    assert MetricName.ALCOHOL_UNITS in names
    assert MetricName.OUTDOOR_MINUTES in names
    assert len(ds.ground_truth.correlations) >= 7
    assert len(ds.ground_truth.anomalies) >= 2
    assert any(p.condition == "afternoon_workout" for p in ds.ground_truth.patterns)


def test_align_bundle_daily_grid():
    ds = generate_synthetic(seed=1, n_days=60, missing_rate=0.1)
    frame, mask = align_bundle(ds.bundle)
    assert not frame.empty
    assert "sleep_duration" in frame.columns
    assert len(frame) >= 50
    assert mask.shape == frame.shape


def test_generator_reproducible():
    a = generate_synthetic(seed=99, n_days=30)
    b = generate_synthetic(seed=99, n_days=30)
    sa = a.bundle.get(MetricName.SLEEP_DURATION)
    sb = b.bundle.get(MetricName.SLEEP_DURATION)
    assert sa is not None and sb is not None
    assert sa.values == sb.values
