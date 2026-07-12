import { motion } from "framer-motion";
import { StorySection } from "../story/StorySection";
import { getSampleTableRows } from "../../data/emilyMockData";

const SOURCES = [
  { name: "Sleep", color: "bg-indigo-400" },
  { name: "Heart rate", color: "bg-rose-400" },
  { name: "Steps", color: "bg-emerald-400" },
  { name: "Workouts", color: "bg-amber-400" },
  { name: "Stress", color: "bg-orange-400" },
  { name: "Caffeine", color: "bg-yellow-500" },
  { name: "Mood", color: "bg-violet-400" },
];

export function Stage02ConnectData() {
  const rows = getSampleTableRows(5);

  return (
    <StorySection
      stageNumber={2}
      title="Connect the Data"
      subtitle="The engine aligns fragmented health streams into one shared daily timeline so relationships across different metrics can be analyzed together."
    >
      <div className="relative flex min-h-[280px] flex-col items-center justify-center rounded-2xl bg-gradient-to-b from-slate-50 to-white p-8">
        <div className="grid w-full max-w-lg grid-cols-3 gap-4 sm:grid-cols-4">
          {SOURCES.map((s, i) => (
            <motion.div
              key={s.name}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="flex flex-col items-center gap-2"
            >
              <div className={`h-3 w-3 rounded-full ${s.color}`} />
              <span className="text-xs font-medium text-slate-600">{s.name}</span>
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 40 + i * 4 }}
                transition={{ delay: 0.4 + i * 0.05, duration: 0.6 }}
                className={`w-0.5 ${s.color} opacity-40`}
              />
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-4 rounded-2xl border-2 border-health-400 bg-white px-6 py-4 text-center shadow-card"
        >
          <p className="text-sm font-semibold text-health-700">
            Health & Wellness Correlation Engine
          </p>
          <p className="mt-1 text-xs text-slate-500">Unified daily timeline</p>
        </motion.div>
      </div>

      <div className="story-card overflow-x-auto">
        <h4 className="mb-3 text-sm font-semibold text-slate-700">Sample daily records</h4>
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <th className="pb-2 pr-3">Date</th>
              <th className="pb-2 pr-3">Sleep</th>
              <th className="pb-2 pr-3">Resting HR</th>
              <th className="pb-2 pr-3">Steps</th>
              <th className="pb-2 pr-3">Workout</th>
              <th className="pb-2 pr-3">Stress</th>
              <th className="pb-2 pr-3">Caffeine</th>
              <th className="pb-2">Mood</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.date} className="border-b border-slate-100">
                <td className="py-2 pr-3 font-mono text-xs">{r.date}</td>
                <td className="py-2 pr-3">{r.sleepDuration}h</td>
                <td className="py-2 pr-3">{r.restingHr}</td>
                <td className="py-2 pr-3">{r.steps.toLocaleString()}</td>
                <td className="py-2 pr-3">{r.workoutMinutes > 0 ? `${r.workoutMinutes}m` : "—"}</td>
                <td className="py-2 pr-3">{r.stress}</td>
                <td className="py-2 pr-3">{r.caffeine}mg</td>
                <td className="py-2">{r.mood}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </StorySection>
  );
}
