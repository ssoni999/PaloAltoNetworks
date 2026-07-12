"""FastAPI application for the Health & Wellness Correlation Engine."""

from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from health_engine import __version__
from health_engine.api.schemas import (
    AnalyzeRequest,
    AnalyzeResponse,
    EvaluateRequest,
    EvaluateResponse,
    HealthResponse,
)
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
