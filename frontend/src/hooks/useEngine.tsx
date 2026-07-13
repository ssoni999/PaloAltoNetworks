import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { analyzeSynthetic, evaluateSynthetic } from "../api/client";
import type { AnalyzeResponse, EvaluateResponse } from "../types/api";

interface EngineState {
  analysis: AnalyzeResponse | null;
  evaluation: EvaluateResponse | null;
  loading: boolean;
  error: string | null;
  runAnalysis: () => Promise<void>;
  runEvaluation: () => Promise<void>;
  clear: () => void;
}

const EngineContext = createContext<EngineState | null>(null);

export function EngineProvider({ children }: { children: ReactNode }) {
  const [analysis, setAnalysis] = useState<AnalyzeResponse | null>(null);
  const [evaluation, setEvaluation] = useState<EvaluateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await analyzeSynthetic({ seed: 42, n_days: 365 });
      setAnalysis(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to reach the analysis API. Start uvicorn on port 8000.",
      );
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const runEvaluation = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await evaluateSynthetic({ seed: 42, n_days: 365 });
      setEvaluation(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to reach the evaluation API.",
      );
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setAnalysis(null);
    setEvaluation(null);
    setError(null);
  }, []);

  const value = useMemo(
    () => ({
      analysis,
      evaluation,
      loading,
      error,
      runAnalysis,
      runEvaluation,
      clear,
    }),
    [analysis, evaluation, loading, error, runAnalysis, runEvaluation, clear],
  );

  return (
    <EngineContext.Provider value={value}>{children}</EngineContext.Provider>
  );
}

export function useEngine(): EngineState {
  const ctx = useContext(EngineContext);
  if (!ctx) {
    throw new Error("useEngine must be used within EngineProvider");
  }
  return ctx;
}
