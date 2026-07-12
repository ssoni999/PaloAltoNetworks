import { motion } from "framer-motion";
import { StorySection } from "../story/StorySection";

interface Props {
  onRestart: () => void;
  onDashboard: () => void;
}

const CARDS = [
  {
    title: "Discover hidden relationships",
    desc: "Lagged and partial correlations reveal connections no single metric shows alone.",
    icon: "🔗",
  },
  {
    title: "Detect unusual health states",
    desc: "Multivariate anomaly detection flags rare combinations that threshold rules miss.",
    icon: "🔍",
  },
  {
    title: "Turn patterns into action",
    desc: "Ranked insights translate statistical findings into behaviors Emily can try.",
    icon: "✨",
  },
];

export function StageFinal({ onRestart, onDashboard }: Props) {
  return (
    <StorySection title="">
      <div className="text-center">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display text-2xl font-semibold text-slate-800 sm:text-3xl"
        >
          Most health apps tell users what happened.
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mt-3 font-display text-xl text-health-700 sm:text-2xl"
        >
          This engine helps explain what changed, what patterns keep repeating,
          and which behaviors are associated with better outcomes.
        </motion.p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {CARDS.map((c, i) => (
          <motion.div
            key={c.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.1 }}
            className="story-card text-center"
          >
            <span className="text-3xl">{c.icon}</span>
            <h4 className="mt-3 font-semibold text-slate-900">{c.title}</h4>
            <p className="mt-2 text-sm text-slate-600">{c.desc}</p>
          </motion.div>
        ))}
      </div>

      <div className="flex flex-wrap justify-center gap-4 pt-4">
        <button type="button" className="btn-secondary" onClick={onRestart}>
          Restart Story
        </button>
        <button type="button" className="btn-primary" onClick={onDashboard}>
          Explore Full Dashboard
        </button>
      </div>
    </StorySection>
  );
}
