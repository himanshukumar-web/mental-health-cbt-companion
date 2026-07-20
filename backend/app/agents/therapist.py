import asyncio
import logging
from typing import AsyncIterator

import anthropic
from groq import AsyncGroq
from app.config import settings

logger = logging.getLogger("sera.therapist")


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

Formatting Rules (IMPORTANT — follow these strictly):
- When the user asks for "step by step", "steps", "list", "points", "tips", "techniques", "exercises", or anything that implies a sequence or enumeration, ALWAYS respond using a **numbered list** format (1. 2. 3. etc.) — NEVER put steps inside a paragraph.
- Use a blank line between each numbered step for readability.
- When listing multiple items, tips, or suggestions, use bullet points (- item).
- Keep each step or bullet point concise (1-2 sentences max per point).
- Use **bold text** for key terms or step titles when helpful.
- Separate different sections with blank lines for clarity.
- NEVER merge multiple steps into a single paragraph block.

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

# Retry constants for transient API failures
MAX_RETRIES = 2
RETRY_DELAY_SECONDS = 1.0


def _get_client():
    """
    Return (client, model_name)
    Supports Groq + OpenRouter + Anthropic
    """

    key = settings.anthropic_api_key

    if not key:
        logger.error("[Sera] No API key configured! Set ANTHROPIC_API_KEY in .env")
        raise ValueError("No API key configured. Set ANTHROPIC_API_KEY in .env")

    # GROQ (Recommended)
    if key.startswith("gsk_"):
        client = AsyncGroq(api_key=key)
        model = "llama-3.3-70b-versatile"
        logger.info("[Sera] Using Groq provider with model: %s", model)

    # OpenRouter
    elif key.startswith("sk-or-"):
        client = anthropic.AsyncAnthropic(
            api_key=key,
            base_url="https://openrouter.ai/api/v1",
        )
        model = "meta-llama/llama-3.3-70b-instruct:free"
        logger.info("[Sera] Using OpenRouter provider with model: %s", model)

    # Anthropic Claude
    else:
        client = anthropic.AsyncAnthropic(api_key=key)
        model = "claude-sonnet-4-20250514"
        logger.info("[Sera] Using Anthropic provider with model: %s", model)

    return client, model


async def stream_response(
    messages: list[dict],
    threat_level: str = "normal",
) -> AsyncIterator[str]:
    """
    Therapist Agent streaming response with retry logic for transient failures.
    """

    system = SYSTEM_PROMPT

    if threat_level == "distress":
        system += DISTRESS_ADDENDUM

    last_error = None

    for attempt in range(MAX_RETRIES + 1):
        try:
            client, model = _get_client()

            # ==========================
            # GROQ STREAMING
            # ==========================
            if settings.anthropic_api_key.startswith("gsk_"):
                logger.debug("[Sera] Groq streaming attempt %d, messages=%d", attempt + 1, len(messages))

                stream = await client.chat.completions.create(
                    model=model,
                    messages=[
                        {"role": "system", "content": system},
                        *messages,
                    ],
                    temperature=0.7,
                    max_tokens=500,
                    stream=True,
                )

                async for chunk in stream:
                    if chunk.choices:
                        content = chunk.choices[0].delta.content
                        if content:
                            yield content

            # ==========================
            # ANTHROPIC / OPENROUTER
            # ==========================
            else:
                logger.debug("[Sera] Anthropic streaming attempt %d, messages=%d", attempt + 1, len(messages))

                async with client.messages.stream(
                    model=model,
                    max_tokens=1000,
                    system=system,
                    messages=messages,
                ) as stream:

                    async for text in stream.text_stream:
                        yield text

            # If we got here without error, streaming was successful
            return

        except Exception as exc:
            last_error = exc
            error_name = type(exc).__name__
            logger.error(
                "[Sera] Therapist stream error (attempt %d/%d): %s: %s",
                attempt + 1, MAX_RETRIES + 1, error_name, str(exc)
            )

            # Don't retry on auth errors — they won't fix themselves
            error_msg = str(exc).lower()
            if "auth" in error_msg or "api_key" in error_msg or "invalid" in error_msg:
                logger.error("[Sera] Authentication error — not retrying")
                break

            if attempt < MAX_RETRIES:
                delay = RETRY_DELAY_SECONDS * (attempt + 1)
                logger.info("[Sera] Retrying in %.1fs...", delay)
                await asyncio.sleep(delay)

    # All retries exhausted
    if last_error:
        raise last_error