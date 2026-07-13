# Health & Wellness Correlation Engine

Discover non-obvious multivariate correlations, holistic anomalies, and recurring patterns in fragmented health time-series data.

## Features

- **Lagged & partial correlation** across sleep, heart rate, workouts, steps, and HRV
- **Multivariate anomaly detection** (Isolation Forest + Mahalanobis) against per-user baselines
- **Periodicity & pattern discovery** (autocorrelation / FFT + conditional event→outcome rules)
- **Ranked actionable insights** with statistical strength and relevance scoring
- **Synthetic data generator** with planted ground truth for evaluation
- **FastAPI** surface: analyze, evaluate, health

## Quick start

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"

# Run evaluation harness
python scripts/evaluate.py

# Run tests
pytest

# Start API
uvicorn health_engine.api.app:app --reload --app-dir src
```

## API

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/v1/health` | GET | Liveness |
| `/v1/analyze` | POST | Run correlation / anomaly / pattern pipeline |
| `/v1/evaluate` | POST | Score engine against synthetic ground truth |

Example analyze request:

```bash
curl -X POST http://127.0.0.1:8000/v1/analyze \
  -H 'Content-Type: application/json' \
  -d '{"use_synthetic": true, "seed": 42, "n_days": 180}'
```

## Success metrics

| Metric | Measurement |
|--------|-------------|
| Anomaly detection accuracy | Precision / recall / F1 vs planted anomalies (±1 day) |
| Correlation discovery | Recovery of planted pairs/lags; FDR |
| Insight relevance | Precision@k of top insights vs planted rules |

## Layout

```
src/health_engine/   # package
frontend/            # React dashboard (Vite)
tests/               # pytest suite
scripts/evaluate.py  # CLI evaluation report
```

## Frontend

An interactive **story-driven demo** follows Emily while calling the **live Python engine**.
Clicking **Investigate Emily's Data** runs `POST /v1/analyze` (synthetic data, seed=42).
Later stages render real Isolation Forest / Mahalanobis diagnostics, lagged & partial
correlations, patterns, ranked insights, and `POST /v1/evaluate` metrics.

### Development

**Both servers are required** — the UI no longer uses hardcoded analysis numbers.

```bash
# Terminal 1 — API
source .venv/bin/activate
uvicorn health_engine.api.app:app --reload --app-dir src

# Terminal 2 — Story UI (Vite proxies /v1 → :8000)
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**

### Production-style (single server)

```bash
cd frontend && npm install && npm run build && cd ..
uvicorn health_engine.api.app:app --app-dir src
```

Open **http://127.0.0.1:8000**

### Story stages

1. Meet Emily → … → 10. Evaluation Results → 11. Conclusion → 12. **Health Advisor Chat**

Technical stages show formulas, z-scores, feature vectors, IF/Mahalanobis thresholds, and FDR-corrected correlations from the API response (`result.diagnostics`, `result.daily_series`).

### Health Advisor Chat (LLM)

The final stage connects to **OpenRouter** via `POST /v1/chat`. Each message re-runs the analysis pipeline and injects correlations, anomalies, patterns, and insights into the LLM context.

```bash
cp .env.example .env
# Edit .env and set OPENROUTER_API_KEY=your_key
pip install -e ".[dev]"   # installs httpx + python-dotenv
uvicorn health_engine.api.app:app --reload --app-dir src
```

Optional: `OPENROUTER_MODEL=openai/gpt-4o-mini` (default)