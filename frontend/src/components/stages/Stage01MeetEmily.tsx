import { useState } from "react";
import { motion } from "framer-motion";
import { EmilyProfileCard } from "../story/EmilyProfileCard";
import { MetricCard } from "../story/MetricCard";
import { StorySection } from "../story/StorySection";
import { ApiStatusBanner } from "../story/TechnicalPanel";
import { emilyData } from "../../data/emilyMockData";
import { useEngine } from "../../hooks/useEngine";

interface Props {
  onInvestigate: () => void;
}

export function Stage01MeetEmily({ onInvestigate }: Props) {
  const { profile } = emilyData;
  const { runAnalysis, loading, error } = useEngine();
  const [started, setStarted] = useState(false);

  async function handleInvestigate() {
    setStarted(true);
    try {
      await runAnalysis();
      onInvestigate();
    } catch {
      // error shown via banner; stay on stage
    }
  }

  return (
    <StorySection
      stageNumber={1}
      title="Emily tracks everything. So why does she still feel exhausted?"
      subtitle="Emily sleeps with a wearable, tracks her workouts, logs caffeine, and monitors her stress. She has thousands of health data points, but no clear explanation for why her energy has recently declined."
    >
      <EmilyProfileCard profile={profile} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard label="Average sleep" value={`${profile.avgSleep}`} unit="hours" accent="blue" />
        <MetricCard label="Resting heart rate" value={`${profile.avgRestingHr}`} unit="BPM" accent="green" />
        <MetricCard label="Average steps" value={profile.avgSteps.toLocaleString()} accent="purple" />
        <MetricCard label="Average stress" value={`${profile.avgStress}`} unit="/ 10" accent="green" />
      </div>

      <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 px-4 py-3 text-sm text-indigo-900">
        <strong>Technical demo:</strong> Clicking Investigate runs{" "}
        <code className="rounded bg-indigo-100 px-1">POST /v1/analyze</code> on
        the Python engine (synthetic data, seed=42). Later stages show live
        Isolation Forest + Mahalanobis scores, lagged correlations, and
        evaluation metrics — not hardcoded narrative numbers.
      </div>

      {(started || error) && (
        <ApiStatusBanner loading={loading} error={error} />
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex justify-center pt-4"
      >
        <button
          type="button"
          className="btn-primary px-8 py-3 text-base"
          onClick={handleInvestigate}
          disabled={loading}
        >
          {loading ? "Running engine…" : "Investigate Emily's Data"}
        </button>
      </motion.div>
    </StorySection>
  );
}
