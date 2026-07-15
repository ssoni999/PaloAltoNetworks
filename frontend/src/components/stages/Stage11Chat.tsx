import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { sendChatMessage } from "../../api/client";
import { StorySection } from "../story/StorySection";
import { ApiStatusBanner } from "../story/TechnicalPanel";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const WELCOME =
  "Hi! I'm Emily's health advisor. I've loaded her 6-month wearable analysis — correlations, multivariate anomalies, and patterns from the engine. What would you like to explore?";

const STARTERS = [
  "Why have my mornings felt low-energy lately?",
  "What does the anomaly on my worst day mean?",
  "Should I change when I work out?",
  "Summarize my top 3 actionable insights.",
];

const CHAT_USE_CASES = [
  "Design a 2-week behavioral experiment (workout timing, caffeine cutoff, screen curfew).",
  "Explain a correlation or pattern in plain language — no stats jargon.",
  "Prioritize which habit to change first based on ranked insights.",
  "Draft a weekly check-in summary from the latest engine run.",
  "Compare a finding to cohort norms: \"Is this just me or common?\"",
  "Build a recovery plan after a flagged anomaly day.",
];

const DATA_SOURCE_IDEAS = [
  "Mood / stress journal — unlocks subjective ↔ biometric links.",
  "Nutrition & meal timing — lagged effects on sleep and HRV.",
  "Menstrual cycle — contextualizes HRV and resting HR swings.",
  "Calendar & travel — explains missing data and routine disruption.",
  "CGM / glucose — metabolic response to workouts and sleep debt.",
  "Environment (light, temp, air quality) — outdoor & sleep quality context.",
];

interface Props {
  onBack: () => void;
  onRestart: () => void;
  onDashboard: () => void;
}

export function Stage11Chat({ onBack, onRestart, onDashboard }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: WELCOME },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function handleSend(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setInput("");
    setLoading(true);
    setError(null);

    const apiMessages = [...messages, { role: "user" as const, content: trimmed }]
      .slice(1)
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const res = await sendChatMessage(apiMessages);
      setMessages((prev) => [...prev, { role: "assistant", content: res.reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chat failed");
      setMessages((prev) => prev.slice(0, -1));
      setInput(trimmed);
    } finally {
      setLoading(false);
    }
  }

  return (
    <StorySection
      stageNumber={10}
      title="Ask Emily's Health Advisor"
      subtitle="An LLM grounded in live engine output — correlations, anomalies, and ranked insights from her data."
    >
      <ApiStatusBanner error={error} loading={loading} />

      <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 px-4 py-3 text-sm text-indigo-900">
        Each reply re-runs the analysis pipeline (seed=42) and injects findings into
        the model context.
      </div>

      <div className="story-card flex h-[420px] flex-col overflow-hidden p-0">
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-health-600 text-white"
                    : "bg-slate-100 text-slate-800"
                }`}
              >
                {m.role === "assistant" && (
                  <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-health-700">
                    Health Advisor
                  </span>
                )}
                {m.content}
              </div>
            </motion.div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-500">
                Analyzing Emily&apos;s data and thinking…
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-slate-100 p-3">
          <div className="mb-2 flex flex-wrap gap-2">
            {STARTERS.map((q) => (
              <button
                key={q}
                type="button"
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 hover:border-health-300 hover:text-health-700"
                onClick={() => void handleSend(q)}
                disabled={loading}
              >
                {q}
              </button>
            ))}
          </div>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void handleSend(input);
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about Emily's sleep, anomalies, patterns…"
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-health-400 focus:outline-none focus:ring-2 focus:ring-health-100"
              disabled={loading}
            />
            <button
              type="submit"
              className="btn-primary shrink-0"
              disabled={loading || !input.trim()}
            >
              Send
            </button>
          </form>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Other chatbot use cases
          </h4>
          <ul className="mt-2 space-y-1.5 text-sm text-slate-600">
            {CHAT_USE_CASES.map((item) => (
              <li key={item} className="flex gap-2 leading-snug">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-health-500" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Data sources to add
          </h4>
          <ul className="mt-2 space-y-1.5 text-sm text-slate-600">
            {DATA_SOURCE_IDEAS.map((item) => (
              <li key={item} className="flex gap-2 leading-snug">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-indigo-400" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-3 pt-2">
        <button type="button" className="btn-secondary" onClick={onBack}>
          ← Back
        </button>
        <button type="button" className="btn-secondary" onClick={onRestart}>
          Restart Story
        </button>
        <button type="button" className="btn-primary" onClick={onDashboard}>
          Full Dashboard
        </button>
      </div>
    </StorySection>
  );
}
