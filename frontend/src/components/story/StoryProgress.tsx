import { motion } from "framer-motion";
import { STORY_STAGES, type StoryStageId } from "../../constants/story";

interface StoryProgressProps {
  current: StoryStageId;
  onSelect: (id: StoryStageId) => void;
}

export function StoryProgress({ current, onSelect }: StoryProgressProps) {
  return (
    <nav
      className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md"
      aria-label="Story progress"
    >
      <div className="mx-auto max-w-6xl px-4 py-3">
        <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
          <span className="font-medium text-health-700">
            Health & Wellness Correlation Engine
          </span>
          <span>
            Step {current + 1} of {STORY_STAGES.length}
          </span>
        </div>
        <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
          {STORY_STAGES.map((s) => {
            const active = s.id === current;
            const done = s.id < current;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onSelect(s.id)}
                className={`group flex min-w-[72px] flex-col items-center gap-1 rounded-lg px-2 py-1.5 transition ${
                  active
                    ? "bg-health-50"
                    : "hover:bg-slate-50"
                }`}
                aria-current={active ? "step" : undefined}
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold transition ${
                    active
                      ? "bg-health-600 text-white"
                      : done
                        ? "bg-health-200 text-health-800"
                        : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {done ? "✓" : s.id + 1}
                </span>
                <span
                  className={`hidden text-[10px] font-medium sm:block ${
                    active ? "text-health-700" : "text-slate-500"
                  }`}
                >
                  {s.short}
                </span>
                {active && (
                  <motion.div
                    layoutId="progress-indicator"
                    className="h-0.5 w-full rounded-full bg-health-500"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
