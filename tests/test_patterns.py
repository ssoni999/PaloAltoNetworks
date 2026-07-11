"""Tests for pattern / periodicity discovery."""

from health_engine.data import align_bundle, generate_synthetic
from health_engine.patterns import discover_patterns, estimate_periods


def test_afternoon_workout_pattern():
    ds = generate_synthetic(seed=42, n_days=180)
    frame, _ = align_bundle(ds.bundle)
    patterns = discover_patterns(frame)
    afternoon = [p for p in patterns if p.condition == "afternoon_workout"]
    assert afternoon
    p = afternoon[0]
    assert p.effect_size > 0
    assert p.significant
    assert p.support >= 5


def test_periodicity_finds_weekly_hint():
    ds = generate_synthetic(seed=42, n_days=180)
    frame, _ = align_bundle(ds.bundle)
    periods = estimate_periods(frame[["workout_minutes", "steps"]].dropna(how="all"))
    assert periods
    # At least one series should hint near 7-day weekly cycle
    hints = [v.get("period_hint") for v in periods.values() if "period_hint" in v]
    assert hints
    assert any(5 <= h <= 9 for h in hints)
