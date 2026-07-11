"""Tests for multivariate anomaly detection."""

from health_engine.anomaly import detect_anomalies
from health_engine.data import align_bundle, generate_synthetic


def test_detects_planted_anomalies():
    ds = generate_synthetic(seed=42, n_days=180)
    frame, _ = align_bundle(ds.bundle)
    events = detect_anomalies(frame, contamination=0.06)
    assert len(events) >= 1

    pred = {e.timestamp.date() for e in events}
    true = {a.day for a in ds.ground_truth.anomalies}
    # At least half of planted anomalies recovered within ±1 day
    hits = 0
    for t in true:
        if any(abs((p - t).days) <= 1 for p in pred):
            hits += 1
    assert hits / len(true) >= 0.5


def test_anomaly_has_contributing_metrics():
    ds = generate_synthetic(seed=42, n_days=180)
    frame, _ = align_bundle(ds.bundle)
    events = detect_anomalies(frame)
    assert events
    assert events[0].contributing_metrics
    assert events[0].explanation
