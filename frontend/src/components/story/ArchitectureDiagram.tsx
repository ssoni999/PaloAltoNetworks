import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const PIPELINE = [
  { id: "sources", label: "Wearable & journal data", detail: "Sleep, HR, steps, workouts, stress, caffeine, and mood streams from Emily's devices and journal." },
  { id: "ingest", label: "Data ingestion", detail: "Raw events are collected and timestamped from multiple sources with different sampling rates." },
  { id: "aggregate", label: "Daily aggregation", detail: "Streams are rolled up to one row per day so cross-metric analysis is possible." },
  { id: "missing", label: "Missing-value handling", detail: "Gaps from device sync failures are imputed or masked so they don't distort correlations." },
  { id: "features", label: "Feature engineering", detail: "Lag features, rolling averages, baseline deviations, and interaction terms are computed." },
  { id: "correlation", label: "Correlation analysis", detail: "Pearson, Spearman, lagged, partial, regression, and Granger predictability tests run across metric pairs.", sub: ["Pearson correlation", "Spearman correlation", "Lagged correlation", "Partial correlation", "Regression", "Granger predictability"] },
  { id: "anomaly", label: "Anomaly detection", detail: "Multivariate Isolation Forest compares today's full health state to Emily's personal baseline.", sub: ["Rolling z-score baseline", "Isolation Forest"] },
  { id: "pattern", label: "Pattern detection", detail: "Autocorrelation and periodicity analysis surface recurring weekly and behavioral cycles.", sub: ["Grouped behavior analysis", "Autocorrelation", "Periodicity detection"] },
];

export function ArchitectureDiagram() {
  const [active, setActive] = useState<string | null>(null);
  const selected = PIPELINE.find((p) => p.id === active);

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-2">
        {PIPELINE.map((block, i) => (
          <div key={block.id} className="flex w-full max-w-md flex-col items-center">
            <button
              type="button"
              onClick={() => setActive(active === block.id ? null : block.id)}
              className={`w-full rounded-xl border px-4 py-3 text-center text-sm font-medium transition ${
                active === block.id
                  ? "border-health-400 bg-health-50 text-health-800 shadow-md"
                  : "border-slate-200 bg-white text-slate-700 hover:border-health-300 hover:bg-health-50/50"
              }`}
            >
              {block.label}
            </button>
            {block.sub && active === block.id && (
              <ul className="mt-2 w-full space-y-1 rounded-lg bg-slate-50 p-3 text-left text-xs text-slate-600">
                {block.sub.map((s) => (
                  <li key={s} className="flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-health-500" />
                    {s}
                  </li>
                ))}
              </ul>
            )}
            {i < PIPELINE.length - 1 && (
              <span className="my-1 text-slate-300">↓</span>
            )}
          </div>
        ))}
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="story-card border-l-4 border-l-health-500"
          >
            <h5 className="font-semibold text-slate-900">{selected.label}</h5>
            <p className="mt-2 text-sm text-slate-600">{selected.detail}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
