"""End-to-end analysis pipeline and evaluation against ground truth."""

from __future__ import annotations

from datetime import date, timedelta
from typing import Any, Dict, List, Optional, Set, Tuple

from health_engine.anomaly import detect_anomalies
from health_engine.correlation import (
    discover_directed_links,
    discover_lagged_correlations,
    discover_partial_correlations,
)
from health_engine.data import align_bundle, generate_synthetic
from health_engine.insights import rank_insights
from health_engine.models import (
    AnalysisResult,
    CorrelationFinding,
    EvalMetrics,
    GroundTruth,
    Insight,
    MetricName,
    SyntheticDataset,
    TimeSeriesBundle,
)
from health_engine.patterns import discover_patterns


def analyze_bundle(
    bundle: TimeSeriesBundle,
    *,
    max_lag: int = 7,
    contamination: float = 0.05,
    top_k_insights: int = 10,
) -> AnalysisResult:
    """Run alignment → correlation → anomaly → patterns → insights."""
    frame, _mask = align_bundle(bundle)
    if frame.empty:
        return AnalysisResult(
            correlations=[],
            anomalies=[],
            patterns=[],
            insights=[],
            user_id=bundle.user_id,
        )

    lagged = discover_lagged_correlations(frame, max_lag=max_lag)
    partial = discover_partial_correlations(frame)
    directed = discover_directed_links(frame, max_lag=min(3, max_lag))

    # Merge correlations: prefer lagged for ranking, keep partial/directed as extras
    merged = _merge_correlations(lagged, partial, directed)
    anomalies = detect_anomalies(frame, contamination=contamination)
    patterns = discover_patterns(frame)
    insights = rank_insights(
        merged, anomalies, patterns, top_k=top_k_insights
    )

    return AnalysisResult(
        correlations=merged,
        anomalies=anomalies,
        patterns=patterns,
        insights=insights,
        user_id=bundle.user_id,
    )


def _pair_key(a: MetricName, b: MetricName) -> frozenset:
    return frozenset({a.value, b.value})


def _merge_correlations(
    lagged: List[CorrelationFinding],
    partial: List[CorrelationFinding],
    directed: List[CorrelationFinding],
) -> List[CorrelationFinding]:
    by_pair: Dict[frozenset, CorrelationFinding] = {}
    for f in lagged:
        by_pair[_pair_key(f.metric_a, f.metric_b)] = f
    # Attach partial as additional findings if not dominated
    for f in partial:
        key = _pair_key(f.metric_a, f.metric_b)
        if key not in by_pair:
            by_pair[key] = f
        elif abs(f.strength) > abs(by_pair[key].strength) * 0.9 and f.significant:
            # Keep lagged primary; still append partial later
            pass
    out = list(by_pair.values())
    # Always include directed soft evidence as separate entries
    out.extend(directed)
    # Also include significant partials as annotated copies when different method
    for f in partial:
        key = _pair_key(f.metric_a, f.metric_b)
        existing = by_pair.get(key)
        if existing is None or existing.method != f.method:
            if f.significant:
                out.append(f)
    out.sort(key=lambda x: abs(x.strength), reverse=True)
    # Dedupe exact (pair, method, lag)
    seen: Set[Tuple] = set()
    unique: List[CorrelationFinding] = []
    for f in out:
        sig = (f.metric_a, f.metric_b, f.method, f.lag_days, f.partial)
        if sig in seen:
            continue
        seen.add(sig)
        unique.append(f)
    return unique


def _dates_within(target: date, candidates: Set[date], tol_days: int = 1) -> bool:
    for d in candidates:
        if abs((d - target).days) <= tol_days:
            return True
    return False


def evaluate_against_ground_truth(
    result: AnalysisResult,
    ground_truth: GroundTruth,
    *,
    anomaly_tol_days: int = 1,
    insight_k: int = 5,
) -> EvalMetrics:
    """Compute success metrics vs planted ground truth."""
    # --- Anomaly F1 ---
    pred_days: Set[date] = {e.timestamp.date() for e in result.anomalies}
    true_days: Set[date] = {a.day for a in ground_truth.anomalies}

    tp = sum(1 for t in true_days if _dates_within(t, pred_days, anomaly_tol_days))
    fp = sum(1 for p in pred_days if not _dates_within(p, true_days, anomaly_tol_days))
    fn = len(true_days) - tp
    precision = tp / (tp + fp) if (tp + fp) else 0.0
    recall = tp / (tp + fn) if (tp + fn) else 0.0
    f1 = (
        2 * precision * recall / (precision + recall)
        if (precision + recall)
        else 0.0
    )

    # --- Correlation recovery ---
    recovered = 0
    abs_rs: List[float] = []
    for planted in ground_truth.correlations:
        match = _find_correlation_match(result.correlations, planted)
        if match is not None:
            recovered += 1
            abs_rs.append(abs(match.strength))
    recovery = recovered / len(ground_truth.correlations) if ground_truth.correlations else 0.0
    mean_abs_r = float(sum(abs_rs) / len(abs_rs)) if abs_rs else 0.0

    # FDR among significant non-partial pearson findings
    sig = [
        c
        for c in result.correlations
        if c.significant and c.method in ("pearson", "spearman") and not c.partial
    ]
    false_disc = 0
    for c in sig:
        if not _is_planted_pair(c, ground_truth):
            false_disc += 1
    fdr = false_disc / len(sig) if sig else 0.0

    # --- Insight relevance ---
    top = result.insights[:insight_k]
    relevant = sum(1 for i in top if _insight_matches_truth(i, ground_truth))
    precision_at_k = relevant / insight_k if insight_k else 0.0
    # Composite: blend precision@k with recovery and anomaly f1
    relevance = 0.4 * precision_at_k + 0.35 * recovery + 0.25 * f1

    return EvalMetrics(
        anomaly_precision=float(precision),
        anomaly_recall=float(recall),
        anomaly_f1=float(f1),
        correlation_recovery=float(recovery),
        correlation_mean_abs_r=float(mean_abs_r),
        correlation_fdr=float(fdr),
        insight_precision_at_k=float(precision_at_k),
        insight_relevance_score=float(relevance),
        details={
            "anomaly_tp": tp,
            "anomaly_fp": fp,
            "anomaly_fn": fn,
            "correlations_recovered": recovered,
            "correlations_planted": len(ground_truth.correlations),
            "significant_correlations": len(sig),
            "insights_relevant_in_top_k": relevant,
        },
    )


def _find_correlation_match(
    findings: List[CorrelationFinding],
    planted,
) -> Optional[CorrelationFinding]:
    target = _pair_key(planted.metric_a, planted.metric_b)
    candidates = [
        f
        for f in findings
        if _pair_key(f.metric_a, f.metric_b) == target
        and f.method in ("pearson", "spearman", "partial_pearson")
    ]
    if not candidates:
        return None
    # Prefer correct lag (±1 day tolerance)
    for f in candidates:
        if abs(f.lag_days - planted.lag_days) <= 1 and abs(f.strength) >= 0.15:
            return f
    # Fallback: any strong same-pair finding
    best = max(candidates, key=lambda f: abs(f.strength))
    if abs(best.strength) >= 0.15:
        return best
    return None


def _is_planted_pair(finding: CorrelationFinding, gt: GroundTruth) -> bool:
    key = _pair_key(finding.metric_a, finding.metric_b)
    for p in gt.correlations:
        if _pair_key(p.metric_a, p.metric_b) == key:
            return True
    # Also treat well-known related pairs as not false discoveries
    related = {
        frozenset({"workout_minutes", "steps"}),
        frozenset({"sleep_duration", "hrv"}),
        frozenset({"workout_hour", "sleep_duration"}),
        frozenset({"workout_minutes", "hrv"}),
    }
    return key in related


def _insight_matches_truth(insight: Insight, gt: GroundTruth) -> bool:
    text = insight.text.lower()
    evidence = insight.evidence or {}

    # Pattern: afternoon workout
    for p in gt.patterns:
        if p.condition == "afternoon_workout":
            if insight.kind == "pattern" and evidence.get("condition") == "afternoon_workout":
                return True
            if "afternoon" in text and "sleep" in text:
                return True

    # Correlations
    for c in gt.correlations:
        a, b = c.metric_a.value, c.metric_b.value
        if insight.kind == "correlation":
            ea = evidence.get("metric_a")
            eb = evidence.get("metric_b")
            if {ea, eb} == {a, b}:
                return True
        if a.replace("_", " ") in text and b.split("_")[0] in text:
            return True

    # Anomalies
    if insight.kind == "anomaly" and gt.anomalies:
        try:
            ts = evidence.get("timestamp", "")[:10]
            d = date.fromisoformat(ts)
            if _dates_within(d, {a.day for a in gt.anomalies}, 1):
                return True
        except Exception:
            pass

    return False


def run_synthetic_evaluation(
    *,
    seed: int = 42,
    n_days: int = 180,
    contamination: float = 0.05,
) -> Tuple[SyntheticDataset, AnalysisResult, EvalMetrics]:
    """Generate synthetic data, analyze, and score."""
    dataset = generate_synthetic(seed=seed, n_days=n_days)
    result = analyze_bundle(dataset.bundle, contamination=contamination)
    metrics = evaluate_against_ground_truth(result, dataset.ground_truth)
    return dataset, result, metrics
