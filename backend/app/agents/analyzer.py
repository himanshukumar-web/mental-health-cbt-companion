"""
AI Analysis Module — Sentiment, Emotion Detection, Insights, CBT, Action Plans.

Uses the same Groq/Anthropic API key as the therapist agent.
Includes lightweight TextBlob fallback for when AI API is unavailable.
"""
import json
import logging
import re
from typing import Optional

from app.config import settings

logger = logging.getLogger("mindmate.analyzer")

# ── Emotion keywords for fast local detection ─────────────────────────────────

EMOTION_KEYWORDS: dict[str, list[str]] = {
    "happy": [
        "happy", "joy", "excited", "grateful", "thankful", "wonderful",
        "amazing", "love", "great", "awesome", "fantastic", "delighted",
        "cheerful", "blissful", "content", "pleased", "elated", "thrilled",
    ],
    "sad": [
        "sad", "unhappy", "depressed", "down", "miserable", "heartbroken",
        "grief", "mourning", "disappointed", "hopeless", "gloomy", "tearful",
        "melancholy", "sorrow", "blue", "dejected", "despondent",
    ],
    "fear": [
        "afraid", "scared", "fear", "terrified", "worried", "nervous",
        "phobia", "dread", "frightened", "horror", "panic", "uneasy",
        "apprehensive", "alarmed", "intimidated",
    ],
    "anger": [
        "angry", "furious", "mad", "rage", "irritated", "frustrated",
        "annoyed", "hostile", "resentful", "bitter", "outraged", "livid",
        "enraged", "infuriated", "agitated",
    ],
    "stress": [
        "stressed", "pressure", "overwhelmed", "burnout", "exhausted",
        "overloaded", "tense", "strained", "deadline", "demanding",
        "hectic", "chaotic", "frantic", "swamped",
    ],
    "anxiety": [
        "anxious", "anxiety", "worry", "restless", "overthinking",
        "ruminating", "racing thoughts", "can't relax", "on edge",
        "unease", "dread", "jittery", "fidgety", "apprehensive",
    ],
    "loneliness": [
        "lonely", "alone", "isolated", "nobody cares", "no friends",
        "disconnected", "abandoned", "left out", "excluded", "invisible",
        "forgotten", "solitary", "withdrawn",
    ],
    "burnout": [
        "burnout", "burned out", "drained", "empty", "no motivation",
        "can't keep going", "exhausted", "tired of everything",
        "nothing matters", "going through the motions", "depleted",
    ],
    "confidence": [
        "confident", "proud", "accomplished", "capable", "strong",
        "empowered", "brave", "determined", "resilient", "self-assured",
        "competent", "worthy", "successful",
    ],
}

THINKING_ERRORS = [
    "All-or-Nothing Thinking",
    "Overgeneralization",
    "Mental Filter",
    "Disqualifying the Positive",
    "Jumping to Conclusions",
    "Magnification / Catastrophizing",
    "Emotional Reasoning",
    "Should Statements",
    "Labeling",
    "Personalization",
]


def detect_emotions_local(text: str) -> dict[str, float]:
    """
    Fast local emotion detection using keyword matching.
    Returns emotion percentages that sum to ~100.
    """
    lower = text.lower()
    scores: dict[str, int] = {}

    for emotion, keywords in EMOTION_KEYWORDS.items():
        count = sum(1 for kw in keywords if kw in lower)
        if count > 0:
            scores[emotion] = count

    if not scores:
        return {"neutral": 100.0}

    total = sum(scores.values())
    return {
        emotion: round((count / total) * 100, 1)
        for emotion, count in sorted(scores.items(), key=lambda x: -x[1])
    }


def analyze_sentiment_local(text: str) -> tuple[str, float]:
    """
    Lightweight sentiment analysis using TextBlob.
    Returns (sentiment_label, score).
    """
    try:
        from textblob import TextBlob
        blob = TextBlob(text)
        polarity = blob.sentiment.polarity  # -1.0 to 1.0

        if polarity > 0.1:
            label = "positive"
        elif polarity < -0.1:
            label = "negative"
        else:
            label = "neutral"

        return label, round((polarity + 1) / 2, 3)  # Normalize to 0-1
    except ImportError:
        logger.warning("TextBlob not installed, using keyword fallback")
        emotions = detect_emotions_local(text)
        positive = emotions.get("happy", 0) + emotions.get("confidence", 0)
        negative = (
            emotions.get("sad", 0) + emotions.get("anger", 0) +
            emotions.get("fear", 0) + emotions.get("stress", 0) +
            emotions.get("anxiety", 0)
        )

        if positive > negative:
            return "positive", 0.7
        elif negative > positive:
            return "negative", 0.3
        return "neutral", 0.5


async def generate_ai_summary(text: str) -> Optional[str]:
    """Generate a brief AI summary of journal text."""
    try:
        client, model = _get_ai_client()
        if not client:
            return _local_summary(text)

        prompt = (
            "Summarize this journal entry in 2-3 compassionate sentences. "
            "Focus on the emotional themes and key takeaways. "
            "Be warm and supportive in tone:\n\n"
            f"{text[:2000]}"
        )

        return await _call_ai(client, model, prompt, max_tokens=200)
    except Exception as e:
        logger.error("AI summary generation failed: %s", e)
        return _local_summary(text)


async def generate_mood_insights(mood_data: list[dict]) -> list[str]:
    """Generate AI insights from mood trend data."""
    if len(mood_data) < 3:
        return ["Keep tracking your mood daily to unlock personalized insights! 📊"]

    try:
        client, model = _get_ai_client()
        if not client:
            return _local_mood_insights(mood_data)

        data_summary = json.dumps([
            {
                "date": str(m.get("date", "")),
                "mood": m.get("mood_score", 3),
                "stress": m.get("stress_level", 5),
                "anxiety": m.get("anxiety_level", 5),
                "sleep": m.get("sleep_hours", 7),
                "water": m.get("water_intake", 4),
                "exercise": m.get("exercise_done", False),
                "meditation": m.get("meditation_done", False),
            }
            for m in mood_data[:30]
        ])

        prompt = (
            "You are a compassionate mental wellness AI. Analyze this mood tracking data "
            "and provide exactly 4 brief, actionable insights. Each insight should be "
            "1 sentence. Look for correlations between sleep, exercise, water intake "
            "and mood/stress/anxiety levels. Be warm and encouraging.\n\n"
            f"Data: {data_summary}\n\n"
            "Return ONLY a JSON array of 4 strings. Example:\n"
            '[\"Your mood improves on days you exercise.\", \"Sleeping less than 6 hours correlates with higher anxiety.\"]'
        )

        result = await _call_ai(client, model, prompt, max_tokens=400)
        if result:
            try:
                parsed = json.loads(result)
                if isinstance(parsed, list):
                    return [str(s) for s in parsed[:5]]
            except json.JSONDecodeError:
                lines = [l.strip().strip('"').strip("- ") for l in result.split("\n") if l.strip()]
                return lines[:5]

        return _local_mood_insights(mood_data)
    except Exception as e:
        logger.error("AI mood insights generation failed: %s", e)
        return _local_mood_insights(mood_data)


async def generate_cbt_worksheet(situation: str, thought: str, emotion: str) -> dict:
    """Generate a complete CBT worksheet using AI."""
    try:
        client, model = _get_ai_client()
        if not client:
            return _local_cbt_worksheet(situation, thought, emotion)

        prompt = (
            "You are a CBT therapist AI. Generate a complete cognitive restructuring worksheet. "
            "Respond ONLY with valid JSON in this exact format:\n"
            '{\n'
            '  "thinking_errors": ["error1", "error2"],\n'
            '  "alternative_thought": "A balanced, realistic alternative thought",\n'
            '  "action_plan": "Specific, actionable steps the person can take"\n'
            '}\n\n'
            f"Situation: {situation}\n"
            f"Automatic Thought: {thought}\n"
            f"Emotion: {emotion}\n"
        )

        result = await _call_ai(client, model, prompt, max_tokens=500)
        if result:
            try:
                match = re.search(r'\{[^{}]*\}', result, re.DOTALL)
                if match:
                    return json.loads(match.group())
            except (json.JSONDecodeError, AttributeError):
                pass

        return _local_cbt_worksheet(situation, thought, emotion)
    except Exception as e:
        logger.error("AI CBT worksheet generation failed: %s", e)
        return _local_cbt_worksheet(situation, thought, emotion)


async def generate_action_plan(chat_history: list[dict]) -> dict:
    """Generate a personalized action plan from chat conversation."""
    try:
        client, model = _get_ai_client()
        if not client:
            return _default_action_plan()

        recent_messages = chat_history[-10:]
        conversation = "\n".join(
            f"{m.get('role', 'user')}: {m.get('content', '')[:200]}"
            for m in recent_messages
        )

        prompt = (
            "Based on this therapy conversation, create a personalized wellness action plan. "
            "Respond ONLY with valid JSON in this exact format:\n"
            '{\n'
            '  "breathing_exercise": "A specific breathing exercise recommendation",\n'
            '  "walking_goal": "A walking/movement goal for today",\n'
            '  "hydration_goal": "A hydration goal",\n'
            '  "meditation_rec": "A meditation recommendation",\n'
            '  "journal_prompt": "A journal writing prompt based on the conversation",\n'
            '  "sleep_rec": "A sleep hygiene recommendation",\n'
            '  "motivational_msg": "A brief, personalized motivational message"\n'
            '}\n\n'
            f"Conversation:\n{conversation}"
        )

        result = await _call_ai(client, model, prompt, max_tokens=600)
        if result:
            try:
                match = re.search(r'\{[^{}]*\}', result, re.DOTALL)
                if match:
                    parsed = json.loads(match.group())
                    plan = _default_action_plan()
                    plan.update({k: v for k, v in parsed.items() if k in plan and v})
                    return plan
            except (json.JSONDecodeError, AttributeError):
                pass

        return _default_action_plan()
    except Exception as e:
        logger.error("AI action plan generation failed: %s", e)
        return _default_action_plan()


async def detect_emotions_ai(text: str) -> dict[str, float]:
    """Detect emotions using AI with local fallback."""
    try:
        client, model = _get_ai_client()
        if not client:
            return detect_emotions_local(text)

        prompt = (
            "Analyze the emotions in this text. Return ONLY a JSON object "
            "where keys are emotion names and values are percentages (0-100). "
            "Use these emotions: happy, sad, fear, anger, stress, anxiety, "
            "loneliness, burnout, confidence. Only include emotions that are present. "
            "Percentages should sum to approximately 100.\n\n"
            f"Text: {text[:1000]}\n\n"
            "Example: {\"anxiety\": 45, \"stress\": 30, \"sad\": 25}"
        )

        result = await _call_ai(client, model, prompt, max_tokens=200)
        if result:
            try:
                match = re.search(r'\{[^{}]*\}', result)
                if match:
                    parsed = json.loads(match.group())
                    return {k: float(v) for k, v in parsed.items() if isinstance(v, (int, float))}
            except (json.JSONDecodeError, AttributeError, ValueError):
                pass

        return detect_emotions_local(text)
    except Exception as e:
        logger.error("AI emotion detection failed: %s", e)
        return detect_emotions_local(text)


# ── Private helpers ───────────────────────────────────────────────────────────

def _get_ai_client():
    """Get the AI client and model, same as therapist agent."""
    key = settings.anthropic_api_key
    if not key:
        return None, None

    try:
        if key.startswith("gsk_"):
            from groq import AsyncGroq
            return AsyncGroq(api_key=key), "llama-3.3-70b-versatile"
        else:
            import anthropic
            return anthropic.AsyncAnthropic(api_key=key), "claude-sonnet-4-20250514"
    except Exception as e:
        logger.error("Failed to create AI client: %s", e)
        return None, None


async def _call_ai(client, model: str, prompt: str, max_tokens: int = 300) -> Optional[str]:
    """Unified AI call that works with both Groq and Anthropic."""
    try:
        if settings.anthropic_api_key.startswith("gsk_"):
            response = await client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.5,
                max_tokens=max_tokens,
            )
            return response.choices[0].message.content if response.choices else None
        else:
            response = await client.messages.create(
                model=model,
                max_tokens=max_tokens,
                messages=[{"role": "user", "content": prompt}],
            )
            return response.content[0].text if response.content else None
    except Exception as e:
        logger.error("AI call failed: %s", e)
        return None


def _local_summary(text: str) -> str:
    """Generate a simple summary without AI."""
    words = text.split()
    if len(words) <= 20:
        return text
    first_sentence = text.split(".")[0] + "."
    return f"{first_sentence} (Entry contains {len(words)} words)"


def _local_mood_insights(mood_data: list[dict]) -> list[str]:
    """Generate basic insights from mood data without AI."""
    insights = []
    if not mood_data:
        return ["Start tracking your mood to see insights here! 📊"]

    avg_mood = sum(m.get("mood_score", 3) for m in mood_data) / len(mood_data)
    avg_sleep = sum(m.get("sleep_hours", 7) for m in mood_data) / len(mood_data)
    exercise_days = sum(1 for m in mood_data if m.get("exercise_done"))
    meditation_days = sum(1 for m in mood_data if m.get("meditation_done"))

    if avg_mood >= 3.5:
        insights.append("🌟 Your average mood has been positive — keep nurturing what's working for you!")
    else:
        insights.append("💙 Your mood has been lower than average. Small daily habits can help shift this over time.")

    if avg_sleep < 6:
        insights.append("😴 Your sleep average is below 6 hours — this could be affecting your mood and anxiety levels.")
    elif avg_sleep >= 7.5:
        insights.append("🌙 Great sleep habits! Maintaining 7+ hours supports better emotional regulation.")

    exercise_pct = (exercise_days / len(mood_data)) * 100
    if exercise_pct >= 50:
        insights.append(f"🏃 You exercised on {exercise_pct:.0f}% of tracked days — movement is strongly linked to mood improvement!")
    else:
        insights.append(f"🏃 You exercised on {exercise_pct:.0f}% of days. Even a 15-minute walk can boost your mood.")

    if meditation_days > 0:
        insights.append(f"🧘 You meditated on {meditation_days} day(s). Regular meditation reduces anxiety over time.")
    else:
        insights.append("🧘 Try adding just 5 minutes of meditation — it can significantly reduce stress.")

    return insights[:4]


def _local_cbt_worksheet(situation: str, thought: str, emotion: str) -> dict:
    """Generate a basic CBT worksheet without AI."""
    return {
        "thinking_errors": ["Jumping to Conclusions", "Emotional Reasoning"],
        "alternative_thought": (
            f"While I felt {emotion.lower()} about this situation, "
            "there might be other ways to look at it. What evidence "
            "supports or contradicts my initial thought?"
        ),
        "action_plan": (
            "1. Write down the evidence for and against this thought.\n"
            "2. Ask yourself: Would I say this to a friend in the same situation?\n"
            "3. Identify one small step you can take to test this thought.\n"
            "4. Practice self-compassion — your feelings are valid even if the thought needs adjusting."
        ),
    }


def _default_action_plan() -> dict:
    """Return a sensible default action plan."""
    return {
        "breathing_exercise": "Try 4-7-8 breathing: inhale for 4 seconds, hold for 7, exhale for 8. Repeat 4 times.",
        "walking_goal": "Take a 15-minute walk outdoors today. Notice 3 things you find beautiful.",
        "hydration_goal": "Drink at least 8 glasses of water today. Set a reminder every hour.",
        "meditation_rec": "Start with a 5-minute guided body scan meditation before bed tonight.",
        "journal_prompt": "Write about one thing that went well today, no matter how small.",
        "sleep_rec": "Set a wind-down alarm 30 minutes before bed. No screens during this time.",
        "motivational_msg": "You showed real courage by exploring your thoughts today. Every conversation is a step forward. 🌱",
    }
