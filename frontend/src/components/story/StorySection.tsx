import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface StorySectionProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  stageNumber?: number;
}

export function StorySection({
  title,
  subtitle,
  children,
  stageNumber,
}: StorySectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto max-w-4xl px-4 py-10"
    >
      {stageNumber != null && (
        <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-health-600">
          Stage {stageNumber}
        </p>
      )}
      <h2 className="font-display text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-3 max-w-2xl text-lg leading-relaxed text-slate-600">
          {subtitle}
        </p>
      )}
      <div className="mt-8 space-y-6">{children}</div>
    </motion.section>
  );
}

interface StoryNavProps {
  onBack: () => void;
  onContinue: () => void;
  canBack: boolean;
  continueLabel?: string;
  backLabel?: string;
}

export function StoryNav({
  onBack,
  onContinue,
  canBack,
  continueLabel = "Continue",
  backLabel = "Back",
}: StoryNavProps) {
  return (
    <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 pb-12 pt-4">
      <button
        type="button"
        className="btn-secondary"
        onClick={onBack}
        disabled={!canBack}
      >
        {backLabel}
      </button>
      <button type="button" className="btn-primary" onClick={onContinue}>
        {continueLabel}
      </button>
    </div>
  );
}
