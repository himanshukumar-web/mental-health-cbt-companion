"""
FastAPI entry point — WebSocket streaming + REST session management.

WebSocket protocol (JSON frames):
  Client → Server: { type: "message", content: str, history: list }
  Server → Client: { type: "monitor_result", threat_level: str }
                   { type: "crisis" }                         (if crisis)
                   { type: "stream_start", agent: "therapist" }
                   { type: "token", content: str }            (repeated)
                   { type: "stream_end", threat_level: str }
                   { type: "error", content: str }
"""
import uuid
import json
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.agents.monitor import analyze_threat_level
from app.agents.therapist import stream_response
from app.database import crud


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[Sera] CBT Companion API starting...")
    yield
    print("[Sera] CBT Companion API shutting down...")


app = FastAPI(
    title="CBT Companion API",
    description="Multi-agent mental health companion powered by LangGraph + Claude",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── REST endpoints ─────────────────────────────────────────────────────────────

@app.get("/health")
async def health_check():
    return {"status": "ok", "version": "1.0.0"}


@app.post("/sessions")
async def create_session():
    session_id = str(uuid.uuid4())
    await crud.create_session(session_id)
    return {"session_id": session_id}


@app.get("/sessions/{session_id}/history")
async def get_history(session_id: str):
    history = await crud.get_session_history(session_id)
    return {"session_id": session_id, "messages": history}


# ── WebSocket endpoint ─────────────────────────────────────────────────────────

@app.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    await websocket.accept()

    try:
        while True:
            raw = await websocket.receive_text()

            try:
                data = json.loads(raw)
            except json.JSONDecodeError:
                continue

            if data.get("type") != "message":
                continue

            content: str = data.get("content", "").strip()
            history: list = data.get("history", [])

            if not content:
                continue

            # ── Agent 2: Monitor ──────────────────────────────────────────────
            threat_level = await analyze_threat_level(content)

            await websocket.send_json(
                {"type": "monitor_result", "threat_level": threat_level}
            )

            # ── Crisis intercept ──────────────────────────────────────────────
            if threat_level == "crisis":
                await websocket.send_json({"type": "crisis"})
                await crud.save_message(session_id, "user", content, "crisis")
                continue

            # ── Agent 1: Therapist (streaming) ────────────────────────────────
            await websocket.send_json({"type": "stream_start", "agent": "therapist"})

            messages = history + [{"role": "user", "content": content}]
            full_response = ""

            try:
                async for token in stream_response(messages, threat_level):
                    full_response += token
                    await websocket.send_json({"type": "token", "content": token})
            except Exception as exc:
                import traceback
                traceback.print_exc()
                await websocket.send_json(
                    {
                        "type": "error",
                        "content": (
                            "I'm having trouble connecting right now. "
                            "Please try again — I'm here for you."
                        ),
                    }
                )
                continue

            await websocket.send_json(
                {"type": "stream_end", "threat_level": threat_level}
            )

            # Persist to Supabase (non-blocking, fire-and-forget)
            await crud.save_message(session_id, "user", content, threat_level)
            await crud.save_message(session_id, "assistant", full_response, "normal")

    except WebSocketDisconnect:
        pass
    except Exception:
        pass
