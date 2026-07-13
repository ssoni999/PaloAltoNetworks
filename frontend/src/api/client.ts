import type { AnalyzeResponse, ChatMessage, ChatResponse, EvaluateResponse } from "../types/api";

const API_BASE = import.meta.env.VITE_API_BASE ?? "";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Request failed (${response.status})`);
  }

  return response.json() as Promise<T>;
}

export function analyzeSynthetic(options?: {
  seed?: number;
  n_days?: number;
  contamination?: number;
  max_lag?: number;
  top_k_insights?: number;
}): Promise<AnalyzeResponse> {
  return request<AnalyzeResponse>("/v1/analyze", {
    method: "POST",
    body: JSON.stringify({
      use_synthetic: true,
      seed: options?.seed ?? 42,
      n_days: options?.n_days ?? 365,
      user_id: "emily_demo",
      max_lag: options?.max_lag ?? 7,
      contamination: options?.contamination ?? 0.05,
      top_k_insights: options?.top_k_insights ?? 10,
    }),
  });
}

export function evaluateSynthetic(options?: {
  seed?: number;
  n_days?: number;
  contamination?: number;
}): Promise<EvaluateResponse> {
  return request<EvaluateResponse>("/v1/evaluate", {
    method: "POST",
    body: JSON.stringify({
      seed: options?.seed ?? 42,
      n_days: options?.n_days ?? 365,
      contamination: options?.contamination ?? 0.05,
    }),
  });
}

export function getHealth(): Promise<{ status: string; version: string }> {
  return request("/v1/health");
}

export function sendChatMessage(
  messages: ChatMessage[],
  options?: { seed?: number; n_days?: number; include_evaluation?: boolean },
): Promise<ChatResponse> {
  return request<ChatResponse>("/v1/chat", {
    method: "POST",
    body: JSON.stringify({
      messages,
      seed: options?.seed ?? 42,
      n_days: options?.n_days ?? 365,
      include_evaluation: options?.include_evaluation ?? true,
    }),
  });
}
