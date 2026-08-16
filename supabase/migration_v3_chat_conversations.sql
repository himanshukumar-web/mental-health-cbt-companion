-- ============================================================
-- MindMate CBT Companion — V3 Migration: Chat Conversations & Therapist Memories
-- Run this in the Supabase SQL editor AFTER migration_v2.sql
-- ============================================================

-- ── Chat Conversations (ChatGPT-style per-therapist chats) ──
CREATE TABLE IF NOT EXISTS chat_conversations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  persona_id   TEXT NOT NULL DEFAULT 'cbt',
  title        TEXT NOT NULL DEFAULT 'New Chat',
  is_pinned    BOOLEAN DEFAULT FALSE,
  is_archived  BOOLEAN DEFAULT FALSE,
  message_count INTEGER DEFAULT 0,
  last_message_preview TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS chat_conv_user_id_idx ON chat_conversations(user_id);
CREATE INDEX IF NOT EXISTS chat_conv_persona_idx ON chat_conversations(user_id, persona_id);
CREATE INDEX IF NOT EXISTS chat_conv_pinned_idx ON chat_conversations(user_id, is_pinned);
CREATE INDEX IF NOT EXISTS chat_conv_updated_idx ON chat_conversations(updated_at DESC);

-- ── Link messages to conversations (optional column, backward-compatible) ──
ALTER TABLE messages ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES chat_conversations(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS messages_conv_id_idx ON messages(conversation_id);

-- ── Therapist Memories (per-therapist independent long-term memory) ──
CREATE TABLE IF NOT EXISTS therapist_memories (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  persona_id   TEXT NOT NULL,
  category     TEXT NOT NULL CHECK (category IN ('goal', 'event', 'preference', 'mood', 'progress', 'summary')),
  memory_text  TEXT NOT NULL,
  weight       INTEGER DEFAULT 1,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS therapist_mem_user_persona_idx ON therapist_memories(user_id, persona_id);
CREATE INDEX IF NOT EXISTS therapist_mem_category_idx ON therapist_memories(user_id, persona_id, category);

-- RLS policies
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapist_memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own conversations" ON chat_conversations
  FOR ALL USING (true);

CREATE POLICY "Users manage own therapist memories" ON therapist_memories
  FOR ALL USING (true);
