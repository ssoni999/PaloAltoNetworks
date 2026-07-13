"""Build LLM context from engine analysis results."""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from health_engine.models import AnalysisResult, MetricName


def _metric_label(name: MetricName | str) -> str:
    if isinstance(name, MetricName):
        name = name.value
    return str(name).replace("_", " ")


def build_emily_context(
    result: AnalysisResult,
    *,
    evaluation_summary: Optional[Dict[str, Any]] = None,
) -> str:
    """Serialize analysis into a compact prompt context for the health advisor."""
    lines: List[str] = [
        "You are advising Emily, a 29-year-old remote product designer.",
        "She tracks sleep, resting heart rate, HRV, steps, and workouts via smartwatch.",
        "Main concern: low morning energy over ~6 months of data.",
        "",
        "IMPORTANT RULES:",
        "- Base answers ONLY on the engine findings below.",
        "- Use association language ('associated with', 'may help'), never diagnose.",
        "- Not medical advice — behavioral wellness insights only.",
        "- Cite specific metrics, lags, and scores when relevant.",
        "",
        "=== ENGINE FINDINGS ===",
        "",
    ]

    if result.daily_series:
        vals = result.daily_series
        sleep = [p.values.get("sleep_duration") for p in vals if p.values.get("sleep_duration")]
        hr = [p.values.get("resting_hr") for p in vals if p.values.get("resting_hr")]
        steps = [p.values.get("steps") for p in vals if p.values.get("steps")]
        if sleep:
            lines.append(f"Typical sleep: {sum(sleep)/len(sleep):.1f} hours (n={len(sleep)} days)")
        if hr:
            lines.append(f"Typical resting HR: {sum(hr)/len(hr):.0f} bpm")
        if steps:
            lines.append(f"Typical steps: {sum(steps)/len(steps):,.0f}/day")
        lines.append("")

    lines.append("TOP RANKED INSIGHTS:")
    for i, ins in enumerate(result.insights[:8], 1):
        lines.append(f"  {i}. [{ins.kind}] (score={ins.score:.2f}) {ins.text}")
    lines.append("")

    sig_corr = [c for c in result.correlations if c.significant][:8]
    other_corr = [c for c in result.correlations if not c.significant][:5]
    lines.append("SIGNIFICANT CORRELATIONS (FDR-corrected):")
    for c in sig_corr or other_corr[:6]:
        lag = f"lag {c.lag_days}d" if c.lag_days else "same day"
        lines.append(
            f"  - {_metric_label(c.metric_a)} ↔ {_metric_label(c.metric_b)}: "
            f"r={c.strength:.3f}, p={c.p_value:.4f}, {lag}, method={c.method}"
            + (" (partial)" if c.partial else "")
        )
    lines.append("")

    if result.patterns:
        lines.append("RECURRING PATTERNS:")
        for p in result.patterns:
            lines.append(
                f"  - {p.condition} → {p.outcome}: effect d={p.effect_size:.2f}, "
                f"n={p.support}, p={p.p_value:.4f}"
                + (f", ~{p.period_hint_days:.0f}d period" if p.period_hint_days else "")
            )
        lines.append("")

    if result.anomalies:
        lines.append("MULTIVARIATE ANOMALIES (Isolation Forest + Mahalanobis):")
        for a in result.anomalies[:5]:
            metrics = ", ".join(_metric_label(m) for m in a.contributing_metrics)
            uni = "univariate thresholds NOT exceeded" if a.univariate_ok else "some univariate thresholds exceeded"
            lines.append(
                f"  - {a.timestamp.date()}: score={a.score:.2f}, drivers={metrics}, {uni}"
            )
        lines.append("")

    if result.diagnostics and result.diagnostics.top_anomaly:
        top = result.diagnostics.top_anomaly
        lines.append("TOP ANOMALY DETAIL:")
        lines.append(f"  Date: {top.date}, combined score={top.combined_score:.3f}")
        lines.append(f"  IF score={top.iso_score:.3f}, Mahalanobis={top.mahalanobis:.2f}")
        if top.z_scores:
            z_txt = ", ".join(f"{k} z={v:.2f}" for k, v in top.z_scores.items())
            lines.append(f"  Z-scores: {z_txt}")
        lines.append("")

    if evaluation_summary:
        lines.append("EVALUATION METRICS (vs planted ground truth):")
        for k, v in evaluation_summary.items():
            lines.append(f"  - {k}: {v}")
        lines.append("")

    return "\n".join(lines)
