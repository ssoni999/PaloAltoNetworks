"""Periodicity estimation via autocorrelation and FFT."""

from __future__ import annotations

from typing import Dict, List, Optional, Tuple

import numpy as np
import pandas as pd
from scipy.signal import find_peaks


def autocorrelation(values: np.ndarray, max_lag: int = 28) -> np.ndarray:
    """Normalized autocorrelation for lags 0..max_lag."""
    x = np.asarray(values, dtype=float)
    x = x[~np.isnan(x)]
    if len(x) < max_lag + 5:
        return np.array([])
    x = x - np.mean(x)
    var = np.dot(x, x)
    if var < 1e-12:
        return np.zeros(max_lag + 1)
    result = np.correlate(x, x, mode="full")
    mid = len(result) // 2
    ac = result[mid : mid + max_lag + 1] / var
    return ac


def dominant_period_autocorr(
    values: np.ndarray,
    *,
    max_lag: int = 28,
    min_lag: int = 2,
) -> Optional[Tuple[float, float]]:
    """
    Return (period_days, peak_autocorr) from the strongest autocorr peak.
    """
    ac = autocorrelation(values, max_lag=max_lag)
    if len(ac) <= min_lag:
        return None
    segment = ac[min_lag:]
    peaks, props = find_peaks(segment, height=0.15, distance=2)
    if len(peaks) == 0:
        # fallback: argmax
        idx = int(np.argmax(segment))
        return float(idx + min_lag), float(segment[idx])
    heights = props["peak_heights"]
    best = int(np.argmax(heights))
    lag = int(peaks[best] + min_lag)
    return float(lag), float(heights[best])


def dominant_period_fft(
    values: np.ndarray,
    *,
    min_period: float = 2.0,
    max_period: float = 28.0,
) -> Optional[Tuple[float, float]]:
    """Return (period_days, power) from FFT peak in [min_period, max_period]."""
    x = np.asarray(values, dtype=float)
    mask = ~np.isnan(x)
    x = x[mask]
    if len(x) < 16:
        return None
    x = x - np.mean(x)
    spectrum = np.fft.rfft(x)
    power = np.abs(spectrum) ** 2
    freqs = np.fft.rfftfreq(len(x), d=1.0)
    # skip DC; avoid divide-by-zero warning
    periods = np.full_like(freqs, np.inf, dtype=float)
    positive = freqs > 0
    periods[positive] = 1.0 / freqs[positive]
    valid = (periods >= min_period) & (periods <= max_period)
    if not valid.any():
        return None
    idx = np.where(valid)[0]
    best = idx[int(np.argmax(power[idx]))]
    return float(periods[best]), float(power[best])


def estimate_periods(frame: pd.DataFrame) -> Dict[str, Dict[str, float]]:
    """Estimate dominant period for each numeric column."""
    out: Dict[str, Dict[str, float]] = {}
    for col in frame.columns:
        vals = frame[col].values
        ac = dominant_period_autocorr(vals)
        fft = dominant_period_fft(vals)
        entry: Dict[str, float] = {}
        if ac is not None:
            entry["autocorr_period"] = ac[0]
            entry["autocorr_strength"] = ac[1]
        if fft is not None:
            entry["fft_period"] = fft[0]
            entry["fft_power"] = fft[1]
        # Consensus hint
        if ac is not None and fft is not None:
            entry["period_hint"] = float(round((ac[0] + fft[0]) / 2.0))
        elif ac is not None:
            entry["period_hint"] = float(ac[0])
        elif fft is not None:
            entry["period_hint"] = float(round(fft[0]))
        if entry:
            out[col] = entry
    return out
