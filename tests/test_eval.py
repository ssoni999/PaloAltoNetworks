"""End-to-end evaluation success-metric gates and API smoke tests."""

from fastapi.testclient import TestClient

from health_engine.api.app import app
from health_engine.pipeline import run_synthetic_evaluation


def test_eval_meets_success_thresholds():
    _ds, result, metrics = run_synthetic_evaluation(seed=42, n_days=180)
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
