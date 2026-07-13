import { AnimatePresence } from "framer-motion";
import { DashboardView } from "./components/dashboard/DashboardView";
import { StoryExperience } from "./components/StoryExperience";
import { StoryProgress } from "./components/story/StoryProgress";
import { EngineProvider } from "./hooks/useEngine";
import { useStoryNavigation } from "./hooks/useStoryNavigation";

export default function App() {
  return (
    <EngineProvider>
      <AppInner />
    </EngineProvider>
  );
}

function AppInner() {
  const nav = useStoryNavigation(0);

  if (nav.mode === "dashboard") {
    return <DashboardView onBackToStory={nav.backToStory} />;
  }

  return (
    <div className="min-h-screen">
      <StoryProgress current={nav.stage} onSelect={nav.goTo} />
      <AnimatePresence mode="wait">
        <StoryExperience
          key={nav.stage}
          stage={nav.stage}
          isFirst={nav.isFirst}
          isLast={nav.isLast}
          onBack={nav.goBack}
          onNext={nav.goNext}
          onRestart={nav.restart}
          onDashboard={nav.openDashboard}
        />
      </AnimatePresence>
    </div>
  );
}
