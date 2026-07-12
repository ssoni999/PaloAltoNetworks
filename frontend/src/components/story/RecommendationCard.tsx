import type { Recommendation } from "../../types/emily";

interface RecommendationCardProps {
  recommendation: Recommendation;
  index: number;
}

export function RecommendationCard({
  recommendation,
  index,
}: RecommendationCardProps) {
  return (
    <div className="story-card border-t-4 border-t-health-500">
      <div className="flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-health-100 text-sm font-bold text-health-700">
          {index + 1}
        </span>
        <div className="flex-1 space-y-3">
          <h4 className="text-lg font-semibold text-slate-900">
            {recommendation.title}
          </h4>
          <p className="text-sm text-slate-600">{recommendation.evidence}</p>

          <div className="grid gap-2 sm:grid-cols-3">
            <MiniStat label="Confidence" value={`${recommendation.confidence}%`} />
            <MiniStat
              label="Observations"
              value={`${recommendation.observations}`}
            />
            <MiniStat label="Why it matters" value="" />
          </div>
          <p className="text-sm text-slate-600">{recommendation.whyItMatters}</p>

          <div className="rounded-xl bg-health-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase text-health-700">
              Suggested action
            </p>
            <p className="mt-1 text-sm font-medium text-slate-800">
              {recommendation.action}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2">
      <p className="text-[10px] font-medium uppercase text-slate-500">{label}</p>
      {value && (
        <p className="text-sm font-semibold text-slate-800">{value}</p>
      )}
    </div>
  );
}
