"""End-to-end evaluation success-metric gates and API smoke tests."""

from fastapi.testclient import TestClient

from health_engine.api.app import app
from health_engine.pipeline import run_synthetic_evaluation


def test_eval_meets_success_thresholds():
    _ds, result, metrics = run_synthetic_evaluation(seed=42, n_days=365)
    assert metrics.anomaly_f1 >= 0.5
    assert metrics.correlation_recovery >= 0.8
    assert metrics.insight_precision_at_k >= 0.4
    assert metrics.insight_relevance_score >= 0.45
    assert result.insights
    assert result.correlations
    assert result.patterns


def test_health_endpoint():
    client = TestClient(app)
    r = client.get("/v1/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_analyze_synthetic_endpoint():
    client = TestClient(app)
    r = client.post(
        "/v1/analyze",
        json={"use_synthetic": True, "seed": 42, "n_days": 90},
    )
    assert r.status_code == 200
    body = r.json()
    assert "result" in body
    assert body["result"]["user_id"]
    assert isinstance(body["result"]["insights"], list)
    assert body["result"]["diagnostics"] is not None
    assert "timeline" in body["result"]["diagnostics"]
    assert isinstance(body["result"]["daily_series"], list)
    assert len(body["result"]["daily_series"]) > 0


def test_anomaly_diagnostics_include_scores():
    from health_engine.anomaly import detect_anomalies_with_diagnostics
    from health_engine.data import align_bundle, generate_synthetic

    ds = generate_synthetic(seed=42, n_days=180)
    frame, _ = align_bundle(ds.bundle)
    events, diagnostics = detect_anomalies_with_diagnostics(frame)
    assert events
    assert diagnostics.timeline
    assert diagnostics.top_anomaly is not None
    assert diagnostics.top_anomaly.flagged
    assert diagnostics.feature_names
    assert "expanding_z" in diagnostics.formulas
    top = diagnostics.top_anomaly
    assert top.iso_score > 0
    assert top.mahalanobis >= 0
    assert top.z_scores
    assert top.univariate_flags
    assert top.feature_vector


def test_evaluate_endpoint():
    client = TestClient(app)
    r = client.post("/v1/evaluate", json={"seed": 42, "n_days": 120})
    assert r.status_code == 200
    body = r.json()
    assert "metrics" in body
    assert body["metrics"]["correlation_recovery"] >= 0.5


def test_analyze_requires_bundle_or_synthetic():
    client = TestClient(app)
    r = client.post("/v1/analyze", json={"use_synthetic": False})
    assert r.status_code == 400
