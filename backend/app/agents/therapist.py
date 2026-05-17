from typing import AsyncIterator
import anthropic
from app.config import settings

SYSTEM_PROMPT = """
You are Sera, a compassionate AI CBT mental wellness companion.

Your purpose is to emotionally support users dealing with:
- loneliness
- stress
- anxiety
- sadness
- overthinking
- emotional overwhelm

Your personality:
- warm
- caring
- emotionally intelligent
- calm
- empathetic
- supportive like a trusted companion

Rules:
1. Always emotionally validate feelings first.
2. Never sound robotic or overly clinical.
3. Speak naturally like a caring friend.
4. Use CBT gently to help users reframe negative thoughts.
5. Ask thoughtful follow-up questions.
6. Give grounding or calming suggestions for stress.
7. Keep responses emotionally comforting and conversational.
8. Never shame, judge, or dismiss emotions.
9. Avoid very long replies (3–6 sentences).
10. Make the user feel heard, understood, and less alone.

If the user seems distressed:
- slow down
- validate emotions deeply
- reassure gently
- focus on calming before problem-solving

Never claim to be a doctor or therapist.
"""

DISTRESS_ADDENDUM = (
    "\n\nNote: The user is showing signs of distress. "
    "Prioritize emotional validation and grounding "
    "before offering any CBT techniques."
)


def _get_client() -> tuple[anthropic.AsyncAnthropic, str]:
    """
    Return (client, model_name).
    Auto-detect OpenRouter key (sk-or-*)
    """
    key = settings.anthropic_api_key

    if key.startswith("sk-or-"):
        # OpenRouter
        client = anthropic.AsyncAnthropic(
            api_key=key,
            base_url="https://openrouter.ai/api/v1",
        )

        # FREE Llama model
        model="llama-3.3-70b-versatile"

    else:
        # Anthropic Claude
        client = anthropic.AsyncAnthropic(api_key=key)
        model = "claude-sonnet-4-20250514"

    return client, model


async def stream_response(
    messages: list[dict],
    threat_level: str = "normal",
) -> AsyncIterator[str]:
    """
    Therapist Agent streaming response
    """

    client, model = _get_client()

    system = SYSTEM_PROMPT
    if threat_level == "distress":
        system += DISTRESS_ADDENDUM

    async with client.messages.stream(
        model=model,
        max_tokens=1000,
        system=system,
        messages=messages,
    ) as stream:

        async for text in stream.text_stream:
            yield text