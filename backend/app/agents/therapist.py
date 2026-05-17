from typing import AsyncIterator
import anthropic
from app.config import settings

SYSTEM_PROMPT = """You are a compassionate CBT (Cognitive Behavioral Therapy) companion named Sera. Your role is to:

1. Listen with deep empathy and without judgment
2. Use CBT techniques: identify cognitive distortions, challenge negative thinking, reframe thoughts
3. Ask thoughtful, open-ended questions to help users explore their feelings
4. Suggest practical coping strategies when appropriate
5. Keep responses warm, concise (2-4 sentences), and conversational
6. Never give medical diagnoses or replace professional therapy
7. If you sense distress, gently validate feelings before offering techniques

You are NOT a crisis counselor. If someone seems in immediate danger, remind them professional help is available.
Respond in first person, warmly, as a supportive companion."""

DISTRESS_ADDENDUM = (
    "\n\nNote: The user is showing signs of distress. Prioritize emotional "
    "validation and grounding before offering any CBT techniques."
)


def _get_client() -> tuple[anthropic.AsyncAnthropic, str]:
    """
    Return (client, model_name).
    Auto-detects OpenRouter keys (sk-or-*) and adjusts the base URL + model.
    """
    key = settings.anthropic_api_key
    if key.startswith("sk-or-"):
        # OpenRouter key — proxy through openrouter.ai
        client = anthropic.AsyncAnthropic(
            api_key=key,
            base_url="https://openrouter.ai/api/v1",
        )
        model = "anthropic/claude-sonnet-4-20250514"
    else:
        # Direct Anthropic key
        client = anthropic.AsyncAnthropic(api_key=key)
        model = "claude-sonnet-4-20250514"
    return client, model


async def stream_response(
    messages: list[dict],
    threat_level: str = "normal",
) -> AsyncIterator[str]:
    """
    Agent 1 — CBT Therapist.

    Streams Claude tokens one at a time via the Anthropic async streaming API.
    The threat_level from the Monitor agent adjusts the system prompt tone.
    """
    client, model = _get_client()
    system = SYSTEM_PROMPT + (DISTRESS_ADDENDUM if threat_level == "distress" else "")

    async with client.messages.stream(
        model=model,
        max_tokens=1000,
        system=system,
        messages=messages,
    ) as stream:
        async for text in stream.text_stream:
            yield text
