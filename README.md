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
tests/               # pytest suite
scripts/evaluate.py  # CLI evaluation report
```
