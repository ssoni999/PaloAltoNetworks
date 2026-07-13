#!/usr/bin/env python3
"""CLI: run the engine on synthetic data and print success metrics."""

from __future__ import annotations

import argparse
import json
import sys


def main(argv: list | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Evaluate Health & Wellness Correlation Engine on synthetic data"
    )
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--n-days", type=int, default=365)
    parser.add_argument("--contamination", type=float, default=0.05)
    parser.add_argument("--json", action="store_true", help="Emit JSON only")
    args = parser.parse_args(argv)

    # Ensure src is importable when run as scripts/evaluate.py
    from pathlib import Path

    root = Path(__file__).resolve().parents[1]
    src = root / "src"
    if str(src) not in sys.path:
        sys.path.insert(0, str(src))

    from health_engine.pipeline import run_synthetic_evaluation

    _dataset, result, metrics = run_synthetic_evaluation(
        seed=args.seed,
        n_days=args.n_days,
        contamination=args.contamination,
    )

    payload = {
        "metrics": metrics.model_dump(),
        "counts": {
            "correlations": len(result.correlations),
            "anomalies": len(result.anomalies),
            "patterns": len(result.patterns),
            "insights": len(result.insights),
        },
        "top_insights": [i.text for i in result.insights[:5]],
    }

    if args.json:
        print(json.dumps(payload, indent=2, default=str))
        return 0

    print("Health & Wellness Correlation Engine — Evaluation Report")
    print("=" * 60)
    print(f"seed={args.seed}  n_days={args.n_days}")
    print()
    print("Anomaly detection")
    print(f"  precision : {metrics.anomaly_precision:.3f}")
    print(f"  recall    : {metrics.anomaly_recall:.3f}")
    print(f"  F1        : {metrics.anomaly_f1:.3f}")
    print()
    print("Correlation discovery")
    print(f"  recovery  : {metrics.correlation_recovery:.3f}")
    print(f"  mean |r|  : {metrics.correlation_mean_abs_r:.3f}")
    print(f"  FDR       : {metrics.correlation_fdr:.3f}")
    print()
    print("Insight relevance")
    print(f"  precision@k : {metrics.insight_precision_at_k:.3f}")
    print(f"  relevance   : {metrics.insight_relevance_score:.3f}")
    print()
    print("Top insights:")
    for i, text in enumerate(payload["top_insights"], 1):
        print(f"  {i}. {text}")
    print()
    print("Details:", json.dumps(metrics.details, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
