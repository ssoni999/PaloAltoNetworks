import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { AnomalyDetail } from "../../types/emily";

interface AnomalyTimelineProps {
  data: { date: string; score: number; isAnomaly: boolean; fullDate: string }[];
  anomaly: AnomalyDetail;
}

export function AnomalyTimeline({ data, anomaly }: AnomalyTimelineProps) {
  const [selected, setSelected] = useState<string | null>(anomaly.date);
  const sampled = data.filter((_, i) => i % 3 === 0);

  return (
    <div className="story-card">
      <h4 className="mb-2 text-sm font-semibold text-slate-700">
        Health timeline — 6 months
      </h4>
      <p className="mb-6 text-sm text-slate-500">
        Select the highlighted day to inspect the unusual health state.
      </p>

      <div className="relative flex items-center gap-1 overflow-x-auto pb-4">
        <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-slate-200" />
        {sampled.map((d) => (
          <button
            key={d.fullDate}
            type="button"
            onClick={() => d.isAnomaly && setSelected(d.fullDate)}
            className={`relative z-10 shrink-0 rounded-full transition ${
              d.isAnomaly
                ? "h-5 w-5 bg-orange-500 shadow-lg shadow-orange-200 ring-4 ring-orange-100"
                : "h-2.5 w-2.5 bg-slate-300 hover:bg-slate-400"
            } ${selected === d.fullDate ? "scale-125" : ""}`}
            title={d.isAnomaly ? `Anomaly: ${d.fullDate}` : d.fullDate}
            aria-label={d.isAnomaly ? `Anomaly on ${d.fullDate}` : d.fullDate}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {selected && (
          <motion.div
            key={selected}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 overflow-hidden rounded-xl border border-orange-200 bg-orange-50/50 p-5"
          >
            <h5 className="text-lg font-semibold text-slate-900">
              An unusual combination was detected
            </h5>
            <p className="mt-1 text-sm text-slate-600">{anomaly.date}</p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {anomaly.deviations.map((d) => (
                <div
                  key={d.metric}
                  className="rounded-lg bg-white px-3 py-2 shadow-sm"
                >
                  <p className="text-xs text-slate-500">{d.metric}</p>
                  <p
                    className={`text-sm font-semibold ${
                      d.direction === "above" ? "text-orange-600" : "text-blue-600"
                    }`}
                  >
                    {d.change}
                  </p>
                </div>
              ))}
            </div>

            <p className="mt-4 text-2xl font-bold text-orange-600">
              Anomaly score: {anomaly.score.toFixed(2)}
            </p>
            <p className="mt-2 text-sm text-slate-600">{anomaly.explanation}</p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <ComparisonCard
                title="Simple threshold model"
                items={anomaly.thresholdFlags.map((f) => ({
                  label: f.metric,
                  flagged: f.flagged,
                }))}
              />
              <ComparisonCard
                title="Multivariate Isolation Forest"
                items={[
                  { label: "Full health state", flagged: true, highlight: true },
                ]}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ComparisonCard({
  title,
  items,
}: {
  title: string;
  items: { label: string; flagged: boolean; highlight?: boolean }[];
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <h6 className="text-sm font-semibold text-slate-800">{title}</h6>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item.label} className="flex items-center justify-between text-sm">
            <span className="text-slate-600">{item.label}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                item.flagged
                  ? item.highlight
                    ? "bg-orange-100 text-orange-700"
                    : "bg-amber-100 text-amber-700"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {item.flagged ? "Flagged" : "Not flagged"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
