CRISIS_KEYWORDS = [
    "kill myself", "end my life", "suicide", "want to die",
    "don't want to live", "self harm", "hurt myself", "cutting",
    "overdose", "no reason to live", "can't go on",
    "give up on life", "better off dead",
]

DISTRESS_KEYWORDS = [
    "panic", "can't breathe", "heart racing", "overwhelmed",
    "breaking down", "falling apart", "losing it", "can't cope",
    "everything is wrong", "spiraling",
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
