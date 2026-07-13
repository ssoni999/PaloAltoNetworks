"""FastAPI application for the Health & Wellness Correlation Engine."""

from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

# Load .env from project root (parent of src/)
_ROOT = Path(__file__).resolve().parents[3]
load_dotenv(_ROOT / ".env")

from health_engine import __version__
from health_engine.api.schemas import (
    AnalyzeRequest,
    AnalyzeResponse,
    ChatRequest,
    ChatResponse,
    EvaluateRequest,
    EvaluateResponse,
    HealthResponse,
)
from health_engine.chat import build_emily_context, chat_with_advisor
from health_engine.chat.advisor import ChatConfigurationError, DEFAULT_MODEL
from health_engine.data import generate_synthetic
from health_engine.pipeline import analyze_bundle, run_synthetic_evaluation

app = FastAPI(
    title="Health & Wellness Correlation Engine",
    version=__version__,
    description=(
        "Discover multivariate correlations, holistic anomalies, "
        "and recurring patterns in health time-series data."
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_FRONTEND_DIST = Path(__file__).resolve().parents[3] / "frontend" / "dist"
if _FRONTEND_DIST.is_dir():
    app.mount("/assets", StaticFiles(directory=_FRONTEND_DIST / "assets"), name="assets")

    @app.get("/")
    def serve_frontend() -> FileResponse:
        return FileResponse(_FRONTEND_DIST / "index.html")


@app.get("/v1/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok", version=__version__)


@app.post("/v1/analyze", response_model=AnalyzeResponse)
def analyze(req: AnalyzeRequest) -> AnalyzeResponse:
    if req.use_synthetic:
        dataset = generate_synthetic(
            user_id=req.user_id, n_days=req.n_days, seed=req.seed
        )
        bundle = dataset.bundle
        meta = {"source": "synthetic", "seed": req.seed, "n_days": req.n_days}
    else:
        if req.bundle is None or not req.bundle.series:
            raise HTTPException(
                status_code=400,
                detail="Provide bundle with series, or set use_synthetic=true",
            )
        bundle = req.bundle
        meta = {"source": "provided", "user_id": bundle.user_id}

    result = analyze_bundle(
        bundle,
        max_lag=req.max_lag,
        contamination=req.contamination,
        top_k_insights=req.top_k_insights,
    )
    return AnalyzeResponse(result=result, meta=meta)


@app.post("/v1/evaluate", response_model=EvaluateResponse)
def evaluate(req: EvaluateRequest) -> EvaluateResponse:
    _dataset, result, metrics = run_synthetic_evaluation(
        seed=req.seed,
        n_days=req.n_days,
        contamination=req.contamination,
    )
    return EvaluateResponse(
        metrics=metrics,
        insight_count=len(result.insights),
        anomaly_count=len(result.anomalies),
        correlation_count=len(result.correlations),
        pattern_count=len(result.patterns),
    )


@app.post("/v1/chat", response_model=ChatResponse)
def chat(req: ChatRequest) -> ChatResponse:
    """Health advisor chat grounded in live engine analysis of Emily's data."""
    if not req.messages:
        raise HTTPException(status_code=400, detail="messages required")
    if req.messages[-1].role != "user":
        raise HTTPException(status_code=400, detail="Last message must be from user")

    dataset = generate_synthetic(
        user_id="emily_demo", n_days=req.n_days, seed=req.seed
    )
    result = analyze_bundle(
        dataset.bundle,
        contamination=req.contamination,
        top_k_insights=10,
    )

    eval_summary = None
    if req.include_evaluation:
        _ds, _res, metrics = run_synthetic_evaluation(
            seed=req.seed,
            n_days=req.n_days,
            contamination=req.contamination,
        )
        eval_summary = {
            "anomaly_f1": round(metrics.anomaly_f1, 3),
            "correlation_recovery": round(metrics.correlation_recovery, 3),
            "insight_relevance": round(metrics.insight_relevance_score, 3),
        }

    context = build_emily_context(result, evaluation_summary=eval_summary)
    history = [(m.role, m.content) for m in req.messages]

    try:
        reply = chat_with_advisor(history, context=context)
    except ChatConfigurationError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    return ChatResponse(
        reply=reply,
        model=os.environ.get("OPENROUTER_MODEL", DEFAULT_MODEL),
        context_preview=context[:500] + ("…" if len(context) > 500 else ""),
    )
