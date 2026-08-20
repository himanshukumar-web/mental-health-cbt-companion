import sys
import os

# Add backend directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.agents.router import route_message_intent, classify_intent
from app.agents.therapist import PERSONAS
import asyncio

TEST_CASES = [
    {
        "id": 1,
        "input": "heyy",
        "history": [],
        "current_persona": "cbt",
        "expected": "general",
        "description": "Short greeting -> General MindMate AI",
    },
    {
        "id": 2,
        "input": "I've been feeling really anxious lately.",
        "history": [],
        "current_persona": "cbt",
        "expected": "cbt",
        "description": "Anxiety expression -> CBT / Emotional Support",
    },
    {
        "id": 3,
        "input": "I keep overthinking everything.",
        "history": [],
        "current_persona": "cbt",
        "expected": "cbt",
        "description": "Overthinking -> CBT / Emotional Support",
    },
    {
        "id": 4,
        "input": "Can you help me with a breathing exercise?",
        "history": [],
        "current_persona": "cbt",
        "expected": "relaxation",
        "description": "Breathing request -> Relaxation",
    },
    {
        "id": 5,
        "input": "I want to start journaling.",
        "history": [],
        "current_persona": "cbt",
        "expected": "wellness",
        "description": "Journaling -> Wellness / Journaling",
    },
    {
        "id": 6,
        "input": "I want to book an appointment with a counselor.",
        "history": [],
        "current_persona": "cbt",
        "expected": "professional_support",
        "description": "Counselor appointment -> Professional Support",
    },
    {
        "id": 7,
        "input": "I'm stressed about exams.",
        "history": [],
        "current_persona": "cbt",
        "expected": "cbt",
        "description": "Exam stress -> CBT / Emotional Support",
    },
    {
        "id": 8,
        "input": "I'm stressed about exams. Can you give me a breathing exercise?",
        "history": [],
        "current_persona": "cbt",
        "expected": "relaxation",
        "description": "Stress + breathing request -> Primary intent: Relaxation",
    },
    {
        "id": 9,
        "input": "What should I do now?",
        "history": [
            {"role": "user", "content": "I'm feeling anxious about my exams."},
            {"role": "assistant", "content": "I hear you, exam stress is so heavy. Let's take it step by step."}
        ],
        "current_persona": "cbt",
        "expected": "cbt",
        "description": "Follow-up question -> Retains existing CBT context",
    },
    {
        "id": 10,
        "input": "Actually, help me meditate.",
        "history": [
            {"role": "user", "content": "I'm feeling anxious about my exams."},
            {"role": "assistant", "content": "I hear you, exam stress is so heavy. Let's take it step by step."},
            {"role": "user", "content": "What should I do now?"},
            {"role": "assistant", "content": "We can look at what is making you feel unprepared."}
        ],
        "current_persona": "cbt",
        "expected": "relaxation",
        "description": "Topic switch to meditation -> Switches to Relaxation",
    },
]


async def run_tests():
    print("=" * 60)
    print("RUNNING MINDMATE SMART AI AUTO-ROUTER TESTS")
    print("=" * 60)

    passed = 0
    failed = 0

    for test in TEST_CASES:
        result = route_message_intent(
            test["input"],
            history=test["history"],
            current_persona_id=test["current_persona"]
        )

        meta = await classify_intent(test["input"], current_persona_id=test["current_persona"], history=test["history"])

        is_ok = (result == test["expected"])
        status = "PASSED [OK]" if is_ok else "FAILED [X]"
        if is_ok:
            passed += 1
        else:
            failed += 1

        print(f"Test {test['id']:2d}: {test['description']}")
        print(f"         Input: \"{test['input']}\"")
        print(f"         Expected: {test['expected']} | Got: {result} ({PERSONAS.get(result, {}).get('name')})")
        print(f"         Status: {status}")
        print("-" * 60)

    print(f"\nSummary: {passed}/{len(TEST_CASES)} passed, {failed} failed.")
    return failed == 0


if __name__ == "__main__":
    success = asyncio.run(run_tests())
    sys.exit(0 if success else 1)
