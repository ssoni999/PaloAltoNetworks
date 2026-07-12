import { motion } from "framer-motion";
import { EmilyProfileCard } from "../story/EmilyProfileCard";
import { MetricCard } from "../story/MetricCard";
import { StorySection } from "../story/StorySection";
import { emilyData } from "../../data/emilyMockData";

interface Props {
  onInvestigate: () => void;
}

export function Stage01MeetEmily({ onInvestigate }: Props) {
  const { profile } = emilyData;

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

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex justify-center pt-4"
      >
        <button type="button" className="btn-primary px-8 py-3 text-base" onClick={onInvestigate}>
          Investigate Emily's Data
        </button>
      </motion.div>
    </StorySection>
  );
}
