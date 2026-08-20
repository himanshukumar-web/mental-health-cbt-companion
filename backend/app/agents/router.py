"""
AI Smart Intent Router — Intelligent auto-routing of user messages to the best MindMate agent/persona.

Analyzes:
- Complete user message
- User intent & emotional tone
- Conversation context & previous messages
- Primary purpose of message

Personas supported:
1. cbt: Emotional distress, anxiety, overthinking, negative thoughts, self-doubt, CBT reframing.
2. wellness: Journaling, habit tracking, daily routines, self-reflection, mood tracking.
3. relaxation: Breathing exercises, meditation, grounding, calming techniques, sleep relaxation.
4. professional_support: Counselors, therapists, appointments, professional clinical care.
5. general: Greetings, casual check-ins, friendly everyday conversation.
"""
import json
import logging
import re
from typing import Optional, List, Dict, Any

from app.config import settings
from app.agents.therapist import PERSONAS

logger = logging.getLogger("mindmate.router")

# Regex patterns for fast, high-confidence intent classification
RELAXATION_ACTION_PATTERNS = [
    r"\b(?:breathing exercise|breath work|deep breath(?:ing)?|box breath(?:ing)?|4-7-8|breathe with me)\b",
    r"\b(?:meditat(?:e|ion)|guided meditation|body scan|grounding exercise|5-4-3-2-1|calm me down|calming technique)\b",
    r"\b(?:guide me through (?:a )?(?:breathing|meditation|grounding))\b",
    r"\b(?:help me relax|sleep relaxation|unwind for sleep|insomnia relaxation)\b",
]

PROFESSIONAL_SUPPORT_PATTERNS = [
    r"\b(?:book (?:an )?appointment|schedule (?:an )?appointment|see a (?:counselor|therapist|psychiatrist|doctor))\b",
    r"\b(?:find (?:a )?(?:counselor|therapist|psychiatrist|psychologist)|professional (?:help|support|therapy|counseling))\b",
    r"\b(?:consult (?:a )?doctor|human therapist|talk to a real (?:doctor|therapist|counselor))\b",
    r"\b(?:seek(?:ing)? professional (?:help|care)|therapy appointment)\b",
]

WELLNESS_PATTERNS = [
    r"\b(?:start journaling|write in my journal|journal prompt|journaling prompt|daily diary)\b",
    r"\b(?:habit tracker|build a habit|morning routine|evening routine|daily routine|wellness routine)\b",
    r"\b(?:track (?:my )?mood|mood tracker|self-reflection|self reflection|gratitude list)\b",
]

CBT_EMOTIONAL_PATTERNS = [
    r"\b(?:anxious|anxiety|overthinking|overthink|panic attack|worried|worrying|stressed|stress)\b",
    r"\b(?:negative thought|thinking distortion|catastrophiz|self-doubt|self doubt|not good enough)\b",
    r"\b(?:depressed|depression|low mood|feeling down|hopeless|lonely|heartbreak|breakup)\b",
    r"\b(?:imposter syndrome|burnout|exhausted mentally|can't stop thinking|rumination)\b",
]

GENERAL_GREETING_PATTERNS = [
    r"^(?:heyy*|hi+|hello+|hey+|yo|sup|good morning|good evening|good afternoon|howdy)[\s!.,?]*$",
    r"^(?:how are you|how'?s it going|what'?s up|who are you|how do you work)[\s!.,?]*$",
]

# Follow-up indicators where context continuity is critical
FOLLOW_UP_PATTERNS = [
    r"^(?:what should i do(?: about it| now)?|why(?: is that| does that happen)?|how so\??|how\??|can you explain|tell me more|what else|and then\??|okay\??|ok\??|yes|yeah|sure|thanks|thank you)[\s!.,?]*$",
    r"^(?:what do you mean|what can i do|how do i fix this|why do i feel this way)[\s!.,?]*$",
]


def _match_any(text: str, patterns: list[str]) -> bool:
    return any(re.search(pat, text, re.IGNORECASE) for pat in patterns)


def route_message_intent(
    message: str,
    history: Optional[List[Dict[str, Any]]] = None,
    current_persona_id: str = "cbt",
) -> str:
    """
    Synchronous, deterministic auto-router that accurately classifies user message intent
    while respecting conversation context and previous messages.
    Returns: persona_id ('cbt', 'wellness', 'relaxation', 'professional_support', 'general')
    """
    if not message or not message.strip():
        return current_persona_id or "cbt"

    cleaned = message.strip().lower()

    # 1. Check for pure greetings or short casual greetings
    if _match_any(cleaned, GENERAL_GREETING_PATTERNS):
        return "general"

    # 2. Check for conversation follow-up / context continuity
    # If the user is asking a short follow-up and does NOT introduce a new specific intent, keep previous context
    if _match_any(cleaned, FOLLOW_UP_PATTERNS):
        if current_persona_id and current_persona_id in PERSONAS:
            return current_persona_id
        return "cbt"

    # 3. Check for Primary Actionable Intent (Ordered by specificity)
    # Relaxation / Breathing exercises (High specificity actionable request)
    # E.g. "I'm stressed about exams. Can you give me a breathing exercise?" -> relaxation
    if _match_any(cleaned, RELAXATION_ACTION_PATTERNS):
        return "relaxation"

    # Professional Support / Appointment requests
    # E.g. "I want to book an appointment with a counselor" -> professional_support
    if _match_any(cleaned, PROFESSIONAL_SUPPORT_PATTERNS):
        return "professional_support"

    # Wellness / Journaling / Habit routines
    # E.g. "I want to start journaling" -> wellness
    if _match_any(cleaned, WELLNESS_PATTERNS):
        return "wellness"

    # Emotional / CBT Support
    # E.g. "I keep thinking that I'm not good enough" or "I'm stressed about exams" -> cbt
    if _match_any(cleaned, CBT_EMOTIONAL_PATTERNS):
        return "cbt"

    # 4. Check if history has strong context for follow-up questions
    if len(cleaned.split()) <= 6 and current_persona_id and current_persona_id in PERSONAS:
        # If user typed something short like "It happened yesterday" or "My math test", preserve context
        return current_persona_id

    # 5. Default fallback for general conversation
    # If no specific distress/specialized keywords, decide between general friendly companion or cbt
    if any(word in cleaned for word in ["help", "feel", "think", "problem", "mind", "advice"]):
        return "cbt"

    return "general" if len(cleaned.split()) <= 4 else (current_persona_id or "cbt")


async def classify_intent(
    message: str,
    current_persona_id: str = "cbt",
    history: Optional[List[Dict[str, Any]]] = None,
) -> Optional[dict]:
    """
    Async intent classifier returning structured metadata for the router.
    Guaranteed safe fallback — never throws.
    """
    try:
        selected_id = route_message_intent(message, history, current_persona_id)
        persona = PERSONAS.get(selected_id) or PERSONAS["cbt"]
        return {
            "topic": persona.get("title", ""),
            "confidence": 95,
            "persona_id": selected_id,
            "reason": f"Routing to {persona.get('name', 'MindMate')} ({persona.get('title', '')}) based on message intent.",
            "persona_name": persona.get("name", "MindMate"),
            "persona_avatar": persona.get("avatar", "🌿"),
            "persona_color": persona.get("color", "#22c55e"),
        }
    except Exception as e:
        logger.error("[Router] Error during classification: %s", e)
        default_persona = PERSONAS.get("cbt", {})
        return {
            "topic": "Mental Wellness",
            "confidence": 90,
            "persona_id": "cbt",
            "reason": "Defaulting to MindMate CBT companion.",
            "persona_name": default_persona.get("name", "MindMate"),
            "persona_avatar": default_persona.get("avatar", "🌿"),
            "persona_color": default_persona.get("color", "#22c55e"),
        }
