interface PipelineStep {
  step: number;
  title: string;
  agent: string;
  llmCalls: string;
  llmOptional?: boolean;
  description: string;
  output: string;
  creativeLlm?: {
    calls: string;
    agent: string;
    idea: string;
  };
}

interface CohortIdea {
  title: string;
  step: string;
  calls: string;
  agent: string;
  whatItCompares: string;
  example: string;
}

const STEPS: PipelineStep[] = [
  {
    step: 0,
    title: "User onboarding & intent capture",
    agent: "Onboarding Agent",
    llmCalls: "0",
    description:
      "A new user connects wearables and journal sources and states their concern (e.g. low morning energy) via a structured form — profile, goals, and device permissions.",
    output: "user_id, profile metadata, connected sources",
  },
  {
    step: 1,
    title: "Data ingestion",
    agent: "Ingestion Agent",
    llmCalls: "0",
    description:
      "Pull raw events from Apple Health, Garmin, journal logs, etc. Pure I/O and schema validation — no reasoning required.",
    output: "Raw MetricSeries per source",
    creativeLlm: {
      calls: "+1",
      agent: "Source Prioritizer Agent",
      idea:
        "Compare this user's connected sources against peers in the same cohort. If sleep and HRV are present but journal tags are missing, recommend the 1–2 extra streams that most improved insight quality for similar users (e.g. caffeine logging unlocked lagged sleep effects for 41% of the cohort).",
    },
  },
  {
    step: 2,
    title: "Daily alignment & missing-value handling",
    agent: "Data Agent",
    llmCalls: "0",
    description:
      "Collapse streams to one row per day, reindex to a shared calendar, and track observation masks. Per-metric aggregation (mean / sum / last), optional forward/back fill.",
    output: "Daily DataFrame + missingness mask",
    creativeLlm: {
      calls: "+1",
      agent: "Data Quality Narrator Agent",
      idea:
        "Contrast missingness patterns with cohort norms. Example: 'Your watch loses sleep data 18% of nights — higher than the 9% cohort median, often on travel weeks. We imputed 12 days; peers with this pattern still recovered afternoon-workout insights once weekend gaps were masked.'",
    },
  },
  {
    step: 3,
    title: "Feature engineering & personal baseline",
    agent: "Feature Agent",
    llmCalls: "0",
    description:
      "Build rolling and expanding baselines, z-scores, lag features, and interaction terms used by downstream modules.",
    output: "Feature matrix for correlation, anomaly, and pattern tools",
    creativeLlm: {
      calls: "+1",
      agent: "Baseline Context Agent",
      idea:
        "Place personal baselines in cohort percentiles without exposing individual peer data. 'Your resting HR baseline sits at the 68th percentile for remote workers with similar step counts; your HRV is bottom-quartile for that same group — that mismatch is worth investigating.'",
    },
  },
  {
    step: 4,
    title: "Correlation discovery",
    agent: "Stats Agent",
    llmCalls: "0",
    description:
      "Compute correlations with standard equations — Pearson, Spearman, lagged, partial, and directed tests across metric pairs, with FDR correction. Pure statistics, no LLM.",
    output: "CorrelationFinding list (strength, p-value, lag, method)",
  },
  {
    step: 5,
    title: "Multivariate anomaly detection",
    agent: "Anomaly Agent",
    llmCalls: "0",
    description:
      "Isolation Forest + Mahalanobis on the full health-state vector. Flag days where the joint state is rare even if no single metric is extreme.",
    output: "AnomalyEvent list + diagnostics (top day, drivers, scores)",
    creativeLlm: {
      calls: "+1",
      agent: "Anomaly Archetype Agent",
      idea:
        "Cluster past anomalies across users into named archetypes (recovery debt, illness-like stack, overtraining, poor-sleep stack). Compare Emily's top anomaly to the nearest archetype: 'This day resembles the recovery-debt cluster seen in 14% of endurance-trackers — usually follows 3 high-load days while sleep stays flat.'",
    },
  },
  {
    step: 6,
    title: "Pattern discovery",
    agent: "Pattern Agent",
    llmCalls: "0",
    description:
      "Detect recurring behavioral conditions (afternoon workouts, high caffeine, screen time, etc.) and periodicity / autocorrelation rhythms.",
    output: "PatternFinding list (effect size, support, p-value)",
    creativeLlm: {
      calls: "+1",
      agent: "Behavioral Contrast Agent",
      idea:
        "Compare behavioral condition effects against cohort distributions. 'Afternoon workouts hurt your sleep (d=0.42) — unusual: only 22% of runners your age see a negative effect; 71% benefit from shifting workouts before noon.' Turns a personal pattern into a relative, actionable contrast.",
    },
  },
  {
    step: 7,
    title: "Insight ranking",
    agent: "Ranker tool",
    llmCalls: "0",
    description:
      "Merge correlations, anomalies, and patterns into a scored top-k list using deterministic composite scores. Template-based text — the factual backbone for chat and dashboards.",
    output: "Top 10 Insight objects (kind, score, evidence)",
  },
  {
    step: 8,
    title: "Anomaly explanation",
    agent: "Explanation Agent",
    llmCalls: "0–1",
    llmOptional: true,
    description:
      "Explain the worst day — which metrics drove the multivariate flag. Can be templated (0 calls) or use one LLM call for a richer plain-language walkthrough.",
    output: "Plain-language walkthrough of top anomaly drivers",
    creativeLlm: {
      calls: "+1",
      agent: "Peer Recovery Playbook Agent",
      idea:
        "Pull anonymized 'what helped next' summaries from users who had the same anomaly archetype within 30 days. 'Peers with this joint sleep+HR+HRV dip who recovered fastest cut evening screen time by 35 min and moved workouts to mornings for 2 weeks.'",
    },
  },
  {
    step: 9,
    title: "Evaluation (internal)",
    agent: "QA Agent",
    llmCalls: "0",
    description:
      "Score recovery vs. planted ground truth — anomaly F1, correlation recovery, insight precision@k. For dev and benchmarking, not shown to real users.",
    output: "EvalMetrics for tuning",
  },
  {
    step: 10,
    title: "Conversational advisor",
    agent: "Advisor Agent",
    llmCalls: "1 per message",
    description:
      "User asks follow-up questions; the advisor answers grounded in live engine output. Each turn loads cached analysis context, appends conversation history, and returns one completion.",
    output: "Behavioral recommendations and plain-language explanations",
    creativeLlm: {
      calls: "+1 per message",
      agent: "Cohort-Grounded Advisor Agent",
      idea:
        "Extend chat context with retrieved cohort vignettes: 'Users like you who tried morning workouts reported improved sleep latency in ~10 days (median, n=847, anonymized).' The LLM never names individuals — only aggregate outcomes and archetype stories.",
    },
  },
];

const COHORT_IDEAS: CohortIdea[] = [
  {
    title: "Population pattern library (offline)",
    step: "Runs nightly across all users",
    calls: "0 at signup",
    agent: "Population Synthesizer Agent",
    whatItCompares:
      "Aggregates anonymized correlation prevalence, pattern effect sizes, and anomaly archetype counts into a cached 'cohort almanac' — no per-user LLM cost.",
    example:
      "'In the remote-worker cohort, lag-1 workout→sleep is positive for 58% of users; afternoon workouts are negative for 22%.'",
  },
  {
    title: "Similar-user retrieval (RAG)",
    step: "Steps 4–7",
    calls: "+0 per user",
    agent: "Cohort Retrieval tool",
    whatItCompares:
      "Vector search over anonymized insight summaries (not raw time-series) to fetch the 5–10 most similar user profiles. Deterministic retrieval; LLM only interprets the matches.",
    example:
      "Emily matches 6 users who also had low morning energy + afternoon workout penalty — their top intervention was workout timing.",
  },
  {
    title: "Cross-user experiment suggestions",
    step: "Step 10",
    calls: "+1",
    agent: "Experiment Designer Agent",
    whatItCompares:
      "Compares user's unresolved findings to A/B-style outcomes observed in the cohort: which behavioral nudges produced measurable metric shifts for peers.",
    example:
      "'Try 10 days of pre-noon workouts — in your cohort this shifted sleep +0.4h for users with a similar afternoon penalty.'",
  },
  {
    title: "Outlier spotlight",
    step: "Step 7",
    calls: "+1",
    agent: "Uniqueness Agent",
    whatItCompares:
      "Highlights findings where the user diverges sharply from cohort norms — often the most valuable coaching moments.",
    example:
      "'Your caffeine doesn't hurt sleep same-day (unlike 81% of peers) but shows up 2 days later — a pattern only 7% of the cohort shares.'",
  },
];

const BUDGET_ROWS = [
  { phase: "Onboarding (structured form)", calls: "0", note: "Profile + device connect" },
  { phase: "Full analysis pipeline (Steps 1–7)", calls: "0", note: "All deterministic" },
  { phase: "Anomaly deep-dive (Step 8)", calls: "+0 or +1", note: "Optional LLM explanation" },
  { phase: "Chat (Step 10)", calls: "+1 per message", note: "Only when user engages" },
];

const COHORT_BUDGET_ROWS = [
  { phase: "Cohort almanac retrieval", calls: "0", note: "Pre-computed nightly; RAG over aggregates" },
  { phase: "Cross-user contrast pass (Steps 3–6)", calls: "+1", note: "Single batched call with cohort snippets" },
  { phase: "Cohort-grounded chat", calls: "+1 per message", note: "Peer outcome stories in context" },
];

function LlmBadge({ calls, optional, creative }: { calls: string; optional?: boolean; creative?: boolean }) {
  const isZero = calls === "0";
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-3 py-1 text-xs font-semibold whitespace-normal text-center ${
        creative
          ? "bg-violet-50 text-violet-800 ring-1 ring-violet-200"
          : isZero
            ? "bg-slate-100 text-slate-600"
            : optional
              ? "bg-amber-50 text-amber-800 ring-1 ring-amber-200"
              : "bg-indigo-50 text-indigo-800 ring-1 ring-indigo-200"
      }`}
    >
      {isZero ? "No LLM" : `${calls} LLM call${calls.includes("per") ? "s" : calls === "1" ? "" : "s"}`}
    </span>
  );
}

function CreativeLlmCallout({
  calls,
  agent,
  idea,
}: {
  calls: string;
  agent: string;
  idea: string;
}) {
  return (
    <div className="mt-4 rounded-xl border-2 border-dashed border-violet-200 bg-violet-50/50 px-4 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-violet-600">
          Creative cohort LLM
        </span>
        <LlmBadge calls={calls} creative />
        <span className="text-xs font-medium text-violet-800">{agent}</span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-violet-900/90">{idea}</p>
    </div>
  );
}

const stepCardClass =
  "story-card border-2 border-slate-200 border-l-[6px] px-6 py-5 sm:px-8 sm:py-6";

export function AgenticPipelineOverview() {
  return (
    <div className="space-y-6">
      <div className={`${stepCardClass} border-l-indigo-500 bg-indigo-50/40`}>
        <h4 className="text-sm font-semibold text-slate-900">
          Agentic end-to-end implementation
        </h4>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          One <strong>Orchestrator Agent</strong> runs a fixed DAG of tools. Most
          steps are deterministic Python tools (no LLM). The LLM is reserved for
          interpretation, narration, and conversation — grounded in structured
          engine output, never inventing numbers.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          <strong className="text-violet-800">Cohort-aware extensions</strong>{" "}
          (dashed violet boxes below) show where you can add LLM calls that compare
          a new user against anonymized population patterns — turning solo
          time-series analysis into &ldquo;what&apos;s true for you vs people like
          you.&rdquo;
        </p>
      </div>

      <ol className="space-y-5">
        {STEPS.map((s) => (
          <li
            key={s.step}
            className={`${stepCardClass} border-l-health-500`}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-health-100 text-sm font-bold text-health-700">
                  {s.step}
                </span>
                <div className="min-w-0">
                  <h5 className="font-semibold text-slate-900">{s.title}</h5>
                  <p className="mt-1 text-xs font-medium text-health-700">
                    {s.agent}
                  </p>
                </div>
              </div>
              <LlmBadge calls={s.llmCalls} optional={s.llmOptional} />
            </div>
            <p className="mt-4 text-sm leading-relaxed text-slate-600">
              {s.description}
            </p>
            <p className="mt-3 text-xs leading-relaxed text-slate-500">
              <span className="font-semibold uppercase tracking-wide text-slate-400">
                Output
              </span>
              {": "}
              {s.output}
            </p>
            {s.creativeLlm && (
              <CreativeLlmCallout
                calls={s.creativeLlm.calls}
                agent={s.creativeLlm.agent}
                idea={s.creativeLlm.idea}
              />
            )}
          </li>
        ))}
      </ol>

      <div className={`${stepCardClass} border-l-violet-500 bg-violet-50/30`}>
        <h4 className="text-sm font-semibold text-slate-900">
          Cross-user comparison patterns
        </h4>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          The key trick: <strong>never send raw peer time-series to the LLM</strong>.
          Nightly jobs aggregate cohort stats (prevalence, median effect sizes,
          anomaly archetypes, intervention outcomes). Per-user LLM calls only
          receive Emily&apos;s findings + retrieved aggregate snippets — privacy-safe
          and token-bounded.
        </p>

        <div className="mt-5 space-y-4">
          {COHORT_IDEAS.map((idea) => (
            <div
              key={idea.title}
              className="rounded-xl border-2 border-violet-100 bg-white px-5 py-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <h5 className="font-semibold text-slate-900">{idea.title}</h5>
                <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-700">
                  {idea.step}
                </span>
                <span className="font-mono text-xs font-semibold text-violet-700">
                  {idea.calls}
                </span>
              </div>
              <p className="mt-1 text-xs font-medium text-violet-800">
                {idea.agent}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {idea.whatItCompares}
              </p>
              <p className="mt-2 rounded-lg bg-violet-50/80 px-3 py-2 text-sm italic leading-relaxed text-violet-900/80">
                {idea.example}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className={`${stepCardClass} border-l-slate-400`}>
        <h4 className="text-sm font-semibold text-slate-900">
          LLM call budget per new user
        </h4>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <th className="pb-2 pr-4 font-semibold">Phase</th>
                <th className="pb-2 pr-4 font-semibold">LLM calls</th>
                <th className="pb-2 font-semibold">Notes</th>
              </tr>
            </thead>
            <tbody className="text-slate-700">
              {BUDGET_ROWS.map((row) => (
                <tr key={row.phase} className="border-b border-slate-100 last:border-0">
                  <td className="py-2.5 pr-4">{row.phase}</td>
                  <td className="py-2.5 pr-4 font-mono text-sm font-semibold text-indigo-700">
                    {row.calls}
                  </td>
                  <td className="py-2.5 text-slate-500">{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border-2 border-slate-200 bg-slate-50 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Lean production path
            </p>
            <p className="mt-1 text-sm text-slate-800">
              <span className="font-mono font-semibold text-indigo-700">0</span>{" "}
              LLM calls at signup +{" "}
              <span className="font-mono font-semibold text-indigo-700">1</span>{" "}
              per chat turn.
            </p>
          </div>
          <div className="rounded-xl border-2 border-violet-200 bg-violet-50 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">
              Cohort-enhanced path
            </p>
            <p className="mt-1 text-sm text-slate-800">
              <span className="font-mono font-semibold text-violet-700">1</span>{" "}
              LLM call at signup (cross-user contrast) +{" "}
              <span className="font-mono font-semibold text-violet-700">1</span>{" "}
              per cohort-grounded chat turn.
            </p>
          </div>
        </div>

        <h5 className="mt-6 text-xs font-semibold uppercase tracking-wide text-violet-600">
          Cohort-enhanced budget breakdown
        </h5>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-violet-100 text-xs uppercase tracking-wide text-violet-500">
                <th className="pb-2 pr-4 font-semibold">Phase</th>
                <th className="pb-2 pr-4 font-semibold">LLM calls</th>
                <th className="pb-2 font-semibold">Notes</th>
              </tr>
            </thead>
            <tbody className="text-slate-700">
              {COHORT_BUDGET_ROWS.map((row) => (
                <tr key={row.phase} className="border-b border-violet-50 last:border-0">
                  <td className="py-2.5 pr-4">{row.phase}</td>
                  <td className="py-2.5 pr-4 font-mono text-sm font-semibold text-violet-700">
                    {row.calls}
                  </td>
                  <td className="py-2.5 text-slate-500">{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-sm text-slate-600">
          <strong>Re-analysis</strong> when new data arrives (e.g. weekly refresh):{" "}
          <span className="font-mono text-indigo-700">0</span> LLM calls for
          recomputation.
        </p>
      </div>

      <div className={`${stepCardClass} border-l-health-600 bg-health-50/30`}>
        <h4 className="text-sm font-semibold text-slate-900">Design principle</h4>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Run the expensive, trustworthy science without an LLM — correlations via
          equations, ranking via composite scores. Use the LLM for optional anomaly
          explanation, cross-user contrast, and interactive Q&amp;A. For Emily&apos;s
          demo: ~6 months of data →{" "}
          <span className="font-mono text-slate-800">0</span> LLM calls for
          analysis → <span className="font-mono text-slate-800">1</span> call each
          time she asks a question in chat.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          With cohort enhancement, add{" "}
          <span className="font-mono text-violet-800">1</span> signup call that
          answers &ldquo;is this just me?&rdquo; by comparing her engine output to
          anonymized population patterns — without exposing individual peer data.
        </p>
      </div>
    </div>
  );
}
