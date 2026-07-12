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

An interactive **story-driven demo** follows Emily, a remote worker whose fatigue the correlation engine investigates step by step. A secondary **dashboard mode** is available after the story for deeper exploration.

### Development

```bash
# Terminal 1 — API (optional; story uses mock data)
source .venv/bin/activate
uvicorn health_engine.api.app:app --reload --app-dir src

# Terminal 2 — Story UI
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

1. Meet Emily → 2. Connect the Data → 3. Learn Her Baseline → 4. Hidden Correlations → 5. Recurring Patterns → 6. Detect an Anomaly → 7. Explain What Happened → 8. Recommend Next Steps → 9. Technical Engine → 10. Evaluation Results → Conclusion → Full Dashboard
