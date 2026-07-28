CRISIS_KEYWORDS = [
    "kill myself", "end my life", "suicide", "want to die",
    "don't want to live", "dont want to live", "self harm", "hurt myself", "cutting",
    "overdose", "no reason to live", "can't go on", "cant go on",
    "give up on life", "better off dead", "ending everything",
    "ending my life", "i want to die", "i don't want to live",
    "i am ending everything", "i'm ending everything", "commit suicide",
    "take my life", "end it all", "goodbye world",
]

DISTRESS_KEYWORDS = [
    "panic", "can't breathe", "cant breathe", "heart racing", "overwhelmed",
    "breaking down", "falling apart", "losing it", "can't cope", "cant cope",
    "everything is wrong", "spiraling", "panic attack",
]


async def analyze_threat_level(text: str) -> str:
    """
    Agent 2 — Safety Monitor.

    Performs a fast two-stage threat assessment:
    1. Keyword matching (O(n), near-instant)
    2. Placeholder for Claude Haiku semantic check on ambiguous input

    Returns: "crisis" | "distress" | "normal"
    """
    lower = text.lower()

    if any(k in lower for k in CRISIS_KEYWORDS):
        return "crisis"

    if any(k in lower for k in DISTRESS_KEYWORDS):
        return "distress"

    return "normal"
