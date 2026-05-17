"""
LangGraph multi-agent state machine for the CBT Companion.

Graph topology:
  START → monitor_node ──► [crisis?] ──► END  (crisis intercept)
                       └──► [safe?]  ──► therapist_node ──► END

The monitor_node populates state["threat_level"].
The therapist_node populates state["response"] (full text, used for DB storage).
Actual token streaming is handled by the WebSocket layer calling stream_response()
directly from the therapist agent, bypassing the graph for performance.
"""
from typing import TypedDict, Literal
from langgraph.graph import StateGraph, END
from app.agents.monitor import analyze_threat_level


class AgentState(TypedDict):
    messages: list[dict]          # conversation history
    user_message: str             # latest user input
    threat_level: str             # "normal" | "distress" | "crisis"
    response: str                 # therapist full response (for persistence)
    session_id: str


# ── Nodes ─────────────────────────────────────────────────────────────────────

async def monitor_node(state: AgentState) -> AgentState:
    """Agent 2: analyse the user message for safety signals."""
    threat_level = await analyze_threat_level(state["user_message"])
    return {**state, "threat_level": threat_level}


async def therapist_node(state: AgentState) -> AgentState:
    """
    Agent 1: placeholder node for graph completeness.
    Real streaming happens in main.py via stream_response().
    """
    return {**state, "response": ""}


# ── Routing ───────────────────────────────────────────────────────────────────

def route_after_monitor(
    state: AgentState,
) -> Literal["therapist_node", "__end__"]:
    if state["threat_level"] == "crisis":
        return END          # intercept — WebSocket sends crisis signal
    return "therapist_node"


# ── Build graph ───────────────────────────────────────────────────────────────

def build_graph():
    g = StateGraph(AgentState)
    g.add_node("monitor_node", monitor_node)
    g.add_node("therapist_node", therapist_node)

    g.set_entry_point("monitor_node")
    g.add_conditional_edges(
        "monitor_node",
        route_after_monitor,
        {"therapist_node": "therapist_node", END: END},
    )
    g.add_edge("therapist_node", END)

    return g.compile()


companion_graph = build_graph()
