"""OpenRouter-backed health advisor chat."""

from __future__ import annotations

import os
from typing import List, Optional, Sequence, Tuple

import httpx

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
DEFAULT_MODEL = os.environ.get("OPENROUTER_MODEL", "openai/gpt-4o-mini")

SYSTEM_PROMPT = """You are a thoughtful health & wellness advisor for Emily.
You have access to findings from a multivariate correlation engine that analyzed
her wearable data using lagged/partial correlations, Isolation Forest anomaly
detection, and pattern discovery.

Your role:
- Answer questions about Emily's data patterns clearly and specifically
- Suggest actionable behavioral experiments (sleep timing, workout timing, recovery)
- Explain technical findings in plain language when asked
- Reference correlations, anomalies, and patterns from the context

Never:
- Diagnose medical conditions
- Claim causation (use "associated with", "followed by")
- Invent data not in the context
- Provide emergency medical advice

Keep responses concise (2-4 paragraphs max unless asked for detail)."""


class ChatConfigurationError(Exception):
    """Raised when the LLM API is not configured."""


def chat_with_advisor(
    messages: Sequence[Tuple[str, str]],
    *,
    context: str,
    api_key: Optional[str] = None,
    model: Optional[str] = None,
) -> str:
    """
    Send conversation to OpenRouter and return assistant reply.

    messages: sequence of (role, content) where role is 'user' or 'assistant'
    """
    key = api_key or os.environ.get("OPENROUTER_API_KEY")
    if not key:
        raise ChatConfigurationError(
            "OPENROUTER_API_KEY is not set. Add it to your .env file."
        )

    payload_messages: List[dict] = [
        {
            "role": "system",
            "content": SYSTEM_PROMPT + "\n\n--- DATA CONTEXT ---\n" + context,
        }
    ]
    for role, content in messages:
        if role not in ("user", "assistant"):
            continue
        payload_messages.append({"role": role, "content": content})

    headers = {
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5173",
        "X-Title": "Health Wellness Correlation Engine",
    }

    body = {
        "model": model or DEFAULT_MODEL,
        "messages": payload_messages,
        "temperature": 0.6,
        "max_tokens": 800,
    }

    with httpx.Client(timeout=60.0) as client:
        response = client.post(OPENROUTER_URL, headers=headers, json=body)
        if response.status_code == 401:
            raise ChatConfigurationError("Invalid OpenRouter API key.")
        if response.status_code >= 400:
            raise RuntimeError(
                f"OpenRouter error {response.status_code}: {response.text[:300]}"
            )
        data = response.json()

    try:
        return str(data["choices"][0]["message"]["content"]).strip()
    except (KeyError, IndexError, TypeError) as exc:
        raise RuntimeError(f"Unexpected OpenRouter response: {data}") from exc
