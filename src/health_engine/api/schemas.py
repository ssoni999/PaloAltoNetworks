"""Pydantic request/response schemas for the FastAPI surface."""

from __future__ import annotations

from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field

from health_engine.models import (
    AnalysisResult,
    EvalMetrics,
    TimeSeriesBundle,
)


class AnalyzeRequest(BaseModel):
    use_synthetic: bool = False
    seed: int = 42
    n_days: int = 180
    user_id: str = "user_demo"
    bundle: Optional[TimeSeriesBundle] = None
    max_lag: int = 7
    contamination: float = 0.05
    top_k_insights: int = 10


class AnalyzeResponse(BaseModel):
    result: AnalysisResult
    meta: Dict[str, Any] = Field(default_factory=dict)


class EvaluateRequest(BaseModel):
    seed: int = 42
    n_days: int = 180
    contamination: float = 0.05


class EvaluateResponse(BaseModel):
    metrics: EvalMetrics
    insight_count: int
    anomaly_count: int
    correlation_count: int
    pattern_count: int


class HealthResponse(BaseModel):
    status: str = "ok"
    version: str


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    seed: int = 42
    n_days: int = 180
    contamination: float = 0.05
    include_evaluation: bool = True


class ChatResponse(BaseModel):
    reply: str
    model: str
    context_preview: str = Field(
        description="First ~500 chars of engine context sent to the LLM"
    )
