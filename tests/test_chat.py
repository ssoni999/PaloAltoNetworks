"""Tests for health advisor chat."""

from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient

from health_engine.api.app import app
from health_engine.chat.context import build_emily_context
from health_engine.data import generate_synthetic
from health_engine.pipeline import analyze_bundle


def test_build_emily_context_includes_insights():
    ds = generate_synthetic(seed=42, n_days=90)
    result = analyze_bundle(ds.bundle)
    ctx = build_emily_context(result)
    assert "ENGINE FINDINGS" in ctx
    assert "INSIGHTS" in ctx
    assert "CORRELATIONS" in ctx
    assert len(ctx) > 200


def test_chat_endpoint_requires_messages():
    client = TestClient(app)
    r = client.post("/v1/chat", json={"messages": []})
    assert r.status_code == 400


@patch("health_engine.chat.advisor.httpx.Client")
def test_chat_endpoint_returns_reply(mock_client_cls):
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "choices": [{"message": {"content": "Try moving workouts before 5 PM."}}]
    }
    mock_client = mock_client_cls.return_value.__enter__.return_value
    mock_client.post.return_value = mock_response

    client = TestClient(app)
    r = client.post(
        "/v1/chat",
        json={
            "messages": [{"role": "user", "content": "Why am I tired in the mornings?"}],
            "seed": 42,
            "n_days": 90,
            "include_evaluation": False,
        },
    )
    assert r.status_code == 200
    body = r.json()
    assert "reply" in body
    assert "workout" in body["reply"].lower()
    assert body["context_preview"]
