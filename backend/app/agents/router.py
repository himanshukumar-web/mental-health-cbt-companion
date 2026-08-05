"""
AI Intent Router — Smart classification of user messages to suggest the best therapist.

Uses lightweight AI call to determine:
- primary_topic (string)
- confidence_score (0-100)
- suggested_therapist (persona ID)

Only suggests switching when confidence > 80% AND suggested ≠ current persona.
"""
import json
import logging
import re
from typing import Optional

from app.config import settings
from app.agents.therapist import PERSONAS

logger = logging.getLogger("sera.router")

# Build a lightweight topic→persona mapping from PERSONAS specializations
PERSONA_SPECIALIZATIONS = {
    pid: persona.get("specializations", [])
    for pid, persona in PERSONAS.items()
}

ROUTER_PROMPT_TEMPLATE = """You are an AI intent classifier for a mental health platform. Analyze the user's message and determine which therapist specialist would be BEST suited to help.

Available therapists:
- cbt (Sera): Negative thoughts, anxiety, depression, CBT, overthinking, thinking distortions, exposure therapy, behavior activation
- compassionate (Luna): Relationships, breakups, loneliness, heartbreak, family issues, grief, emotional validation, self-worth, empathy
- motivational (Axel): Discipline, goals, productivity, confidence, gym, career, procrastination, success mindset
- mindfulness (Zen): Meditation, stress relief, sleep, mindfulness, breathing, relaxation, panic calming
- stress (Kai): Work stress, study pressure, burnout, time management, work-life balance, boundaries
- study (Maya): Exams, interview prep, learning, assignments, career planning, student productivity

User message: "{message}"

Respond ONLY with valid JSON:
{{"topic": "brief topic", "confidence": 0-100, "persona_id": "one of: cbt/compassionate/motivational/mindfulness/stress/study", "reason": "one sentence why"}}"""

CONFIDENCE_THRESHOLD = 80


async def classify_intent(
    message: str,
    current_persona_id: str = "cbt",
) -> Optional[dict]:
    """
    Classify user message intent and suggest the best-fit therapist.

    Returns None if:
    - Classification fails
    - Confidence < threshold
    - Suggested persona == current persona

    Returns dict with: topic, confidence, persona_id, reason, persona_name
    """
    # First try fast keyword matching (zero API cost)
    keyword_result = _keyword_classify(message, current_persona_id)
    if keyword_result:
        return keyword_result

    # Fall back to AI classification for ambiguous messages
    try:
        ai_result = await _ai_classify(message, current_persona_id)
        return ai_result
    except Exception as e:
        logger.error("[Router] Classification failed: %s", e)
        return None


def _keyword_classify(message: str, current_persona_id: str) -> Optional[dict]:
    """
    Fast keyword-based intent classification. O(n) scan, no API cost.
    Only returns a result if there's a strong keyword match for a DIFFERENT persona.
    """
    lower = message.lower()
    scores: dict[str, int] = {}

    for persona_id, specializations in PERSONA_SPECIALIZATIONS.items():
        count = sum(1 for spec in specializations if spec in lower)
        if count > 0:
            scores[persona_id] = count

    if not scores:
        return None

    # Find best match
    best_id = max(scores, key=scores.get)  # type: ignore
    best_count = scores[best_id]

    # Only suggest if clearly better than current AND has strong signal
    current_count = scores.get(current_persona_id, 0)

    if best_id == current_persona_id:
        return None

    # Need at least 2 keyword matches AND significantly more than current
    if best_count < 2 or best_count <= current_count:
        return None

    # Compute a pseudo-confidence based on keyword density
    total = sum(scores.values())
    confidence = int((best_count / total) * 100) if total > 0 else 0

    if confidence < CONFIDENCE_THRESHOLD:
        return None

    persona = PERSONAS.get(best_id, {})
    return {
        "topic": persona.get("title", ""),
        "confidence": confidence,
        "persona_id": best_id,
        "reason": f"Your message relates to {persona.get('title', '').lower()} — {persona.get('name', '')} specializes in this area.",
        "persona_name": persona.get("name", ""),
        "persona_avatar": persona.get("avatar", ""),
        "persona_color": persona.get("color", ""),
    }


async def _ai_classify(message: str, current_persona_id: str) -> Optional[dict]:
    """
    AI-powered intent classification for ambiguous messages.
    Uses a lightweight prompt (~100 tokens) for minimal cost.
    """
    key = settings.anthropic_api_key
    if not key:
        return None

    prompt = ROUTER_PROMPT_TEMPLATE.format(message=message[:500])

    try:
        if key.startswith("gsk_"):
            from groq import AsyncGroq
            client = AsyncGroq(api_key=key)
            response = await client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1,
                max_tokens=150,
            )
            result_text = response.choices[0].message.content if response.choices else None
        else:
            import anthropic
            client = anthropic.AsyncAnthropic(api_key=key)
            response = await client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=150,
                messages=[{"role": "user", "content": prompt}],
            )
            result_text = response.content[0].text if response.content else None

        if not result_text:
            return None

        # Parse JSON response
        match = re.search(r'\{[^{}]*\}', result_text, re.DOTALL)
        if not match:
            return None

        parsed = json.loads(match.group())
        persona_id = parsed.get("persona_id", "")
        confidence = int(parsed.get("confidence", 0))
        topic = parsed.get("topic", "")
        reason = parsed.get("reason", "")

        # Validate persona_id
        if persona_id not in PERSONAS:
            return None

        # Skip if same as current or low confidence
        if persona_id == current_persona_id:
            return None

        if confidence < CONFIDENCE_THRESHOLD:
            return None

        persona = PERSONAS[persona_id]
        return {
            "topic": topic,
            "confidence": confidence,
            "persona_id": persona_id,
            "reason": reason,
            "persona_name": persona.get("name", ""),
            "persona_avatar": persona.get("avatar", ""),
            "persona_color": persona.get("color", ""),
        }

    except Exception as e:
        logger.error("[Router] AI classification error: %s", e)
        return None
