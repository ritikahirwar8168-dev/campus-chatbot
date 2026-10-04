"""
Centralised Ollama / Gemma LLM service.

Every AI feature calls *this* module – the rest of the backend never
touches httpx or model config directly.
"""

from __future__ import annotations

import json
import logging
from typing import Any

import httpx

from app.config import settings

logger = logging.getLogger(__name__)


# ── public helpers ──────────────────────────────────────────────────

def is_enabled() -> bool:
    """Return True when Ollama integration is switched on."""
    return bool(settings.ollama_enabled and settings.ollama_base_url)


async def health() -> dict:
    """Quick reachability check against the Ollama server."""
    if not is_enabled():
        return {"ok": False, "reason": "ollama_enabled is false or base URL is empty"}
    url = settings.ollama_base_url.rstrip("/").replace("/v1", "") + "/api/tags"
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            return {"ok": True, "models": resp.json().get("models", [])}
    except Exception as exc:
        return {"ok": False, "reason": str(exc)}


async def generate(
    *,
    system_prompt: str,
    user_message: str,
    context: dict | None = None,
    history: list[dict] | None = None,
    temperature: float = 0.4,
    max_context_chars: int = 8000,
) -> str | None:
    """
    Send a chat-completion request to Ollama (OpenAI-compatible endpoint).

    Returns the assistant's text, or *None* when the call fails so that
    callers can fall back to deterministic logic.
    """
    if not is_enabled():
        return None

    messages: list[dict[str, str]] = [
        {"role": "system", "content": system_prompt},
    ]

    if context:
        ctx_text = json.dumps(context, default=str)[:max_context_chars]
        messages.append(
            {"role": "system", "content": f"Student context JSON:\n{ctx_text}"}
        )

    if history:
        for item in history[-8:]:
            role = item.get("role", "user")
            content = item.get("content", "")
            if role in {"user", "assistant"} and content:
                messages.append({"role": role, "content": content})

    messages.append({"role": "user", "content": user_message})

    url = settings.ollama_base_url.rstrip("/") + "/chat/completions"
    headers: dict[str, str] = {}
    # Ollama does not need an API key but the OpenAI-compat layer accepts one
    if settings.ollama_api_key:
        headers["Authorization"] = f"Bearer {settings.ollama_api_key}"

    body: dict[str, Any] = {
        "model": settings.ollama_model,
        "messages": messages,
        "temperature": temperature,
    }

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(url, headers=headers, json=body)
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"]
    except Exception:
        logger.exception("Ollama call failed")
        return None


async def generate_json(
    *,
    system_prompt: str,
    user_message: str,
    context: dict | None = None,
    temperature: float = 0.3,
) -> Any | None:
    """
    Convenience wrapper: calls ``generate`` then parses the response as JSON.

    Falls back to extracting the first JSON array/object from the text when
    the model wraps its answer in markdown fences.
    """
    text = await generate(
        system_prompt=system_prompt,
        user_message=user_message,
        context=context,
        temperature=temperature,
    )
    if text is None:
        return None

    # Try direct parse first
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Strip markdown code fences and retry
    import re
    match = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
    if match:
        try:
            return json.loads(match.group(1).strip())
        except json.JSONDecodeError:
            pass

    return None
