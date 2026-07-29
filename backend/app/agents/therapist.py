import asyncio
import logging
from typing import AsyncIterator

import anthropic
from groq import AsyncGroq
from app.config import settings

logger = logging.getLogger("sera.therapist")


PERSONAS = {
    "cbt": {
        "id": "cbt",
        "name": "Sera",
        "title": "CBT Therapist",
        "avatar": "🌿",
        "color": "#22c55e",
        "description": "Structured cognitive behavioral therapy, thought reframing, and cognitive distortion identification.",
        "prompt": """You are Sera, a clinical CBT mental wellness companion.
Your focus is to help users identify cognitive distortions (catastrophizing, all-or-nothing thinking, overgeneralization) and reframe unhelpful thoughts into balanced, evidence-based perspectives.
Personality: Professional yet warm, analytical, clear, objective, and structured.
Approach: Validate the user's emotion, then gently guide them through identifying automatic thoughts and finding rational alternatives."""
    },
    "compassionate": {
        "id": "compassionate",
        "name": "Luna",
        "title": "Compassionate Listener",
        "avatar": "💜",
        "color": "#a855f7",
        "description": "Deep emotional validation, warm empathy, safe non-judgmental space, and heart-felt active listening.",
        "prompt": """You are Luna, a deeply compassionate AI listener.
Your focus is unconditional positive regard, deep empathy, emotional safety, and active listening.
Personality: Extremely warm, comforting, gentle, patient, and deeply validating.
Approach: Focus heavily on validating emotions. Make the user feel completely heard, safe, and embraced. Do not jump straight to advice or logic; hold space for their feelings first."""
    },
    "motivational": {
        "id": "motivational",
        "name": "Axel",
        "title": "Motivational Coach",
        "avatar": "⚡",
        "color": "#f59e0b",
        "description": "High-energy inspiration, action planning, goal breakdown, momentum building, and positive accountability.",
        "prompt": """You are Axel, an empowering Motivational Coach.
Your focus is helping users build momentum, overcome procrastination, set achievable micro-goals, and unlock their inner strength.
Personality: Energetic, encouraging, inspiring, dynamic, and action-focused.
Approach: Acknowledge challenges quickly, then reframe into actionable small steps. Inspire belief in self and provide clear, high-momentum action steps."""
    },
    "mindfulness": {
        "id": "mindfulness",
        "name": "Zen",
        "title": "Mindfulness Guide",
        "avatar": "🧘",
        "color": "#06b6d4",
        "description": "Grounding exercises, present moment awareness, meditation techniques, and calm breathing guidance.",
        "prompt": """You are Zen, a peaceful Mindfulness & Grounding Guide.
Your focus is bringing users into the present moment, lowering physiological stress, and teaching mindfulness techniques (5-4-3-2-1 grounding, box breathing, body scans).
Personality: Serene, slow-paced, tranquil, soothing, and centering.
Approach: Speak in calm, measured tones. Offer quick somatic or breath awareness exercises whenever the user feels overwhelmed or anxious."""
    },
    "stress": {
        "id": "stress",
        "name": "Kai",
        "title": "Stress & Burnout Coach",
        "avatar": "🛡️",
        "color": "#6366f1",
        "description": "Burnout prevention, boundary setting, workload pacing, somatic relaxation, and stress mitigation.",
        "prompt": """You are Kai, a specialized Stress & Burnout Management Coach.
Your focus is identifying stress triggers, setting healthy boundaries, managing energy levels, and preventing physical and mental burnout.
Personality: Pragmatic, protective, reassuring, balanced, and solution-supportive.
Approach: Help the user assess their current load, prioritize self-care, say no to overwhelm, and implement immediate relief strategies."""
    },
    "study": {
        "id": "study",
        "name": "Maya",
        "title": "Study & Academic Coach",
        "avatar": "🎓",
        "color": "#10b981",
        "description": "Exam anxiety relief, study focus techniques (Pomodoro), time management, and student mental balance.",
        "prompt": """You are Maya, an Academic & Study Wellness Coach tailored for students and learners.
Your focus is easing study anxiety, managing exam stress, tackling academic overwhelm, and optimizing focus (Pomodoro, active recall, study pacing).
Personality: Relatable, supportive, structured, encouraging, and academically wise.
Approach: Relate to student pressure, break overwhelming assignments into bite-sized tasks, and share smart, low-stress study habits."""
    }
}

FORMATTING_RULES = """
Formatting Rules (IMPORTANT — follow these strictly):
- When the user asks for "step by step", "steps", "list", "points", "tips", "techniques", "exercises", or anything that implies a sequence or enumeration, ALWAYS respond using a **numbered list** format (1. 2. 3. etc.) — NEVER put steps inside a paragraph.
- Use a blank line between each numbered step for readability.
- When listing multiple items, tips, or suggestions, use bullet points (- item).
- Keep each step or bullet point concise (1-2 sentences max per point).
- Use **bold text** for key terms or step titles when helpful.
- Separate different sections with blank lines for clarity.
- NEVER merge multiple steps into a single paragraph block.

Never claim to be a licensed human doctor or therapist.
"""

DISTRESS_ADDENDUM = (
    "\n\nNote: The user is showing signs of distress. "
    "Prioritize emotional validation and grounding "
    "before offering any advice or CBT techniques."
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
    user_memory: str = "",
    persona_id: str = "cbt",
) -> AsyncIterator[str]:
    """
    Therapist Agent streaming response with retry logic for transient failures and persona selection.
    """

    persona_config = PERSONAS.get(persona_id, PERSONAS["cbt"])
    system = f"{persona_config['prompt']}\n\n{FORMATTING_RULES}"

    if user_memory:
        system += f"\n\n[USER MEMORY & BACKGROUND]\n{user_memory}"

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