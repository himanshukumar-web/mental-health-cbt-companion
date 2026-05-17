-- ============================================================
-- Sera CBT Companion — Supabase Schema
-- Run this in the Supabase SQL editor (Dashboard → SQL → New query)
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ── Sessions ─────────────────────────────────────────────────
create table if not exists sessions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete set null,
  mood_score   smallint check (mood_score between 0 and 4),
  started_at   timestamptz not null default now(),
  ended_at     timestamptz,
  created_at   timestamptz not null default now()
);

-- ── Messages ─────────────────────────────────────────────────
create table if not exists messages (
  id                uuid primary key default gen_random_uuid(),
  session_id        uuid not null references sessions(id) on delete cascade,
  role              text not null check (role in ('user', 'assistant')),
  content_encrypted text not null,          -- Fernet-encrypted on the backend
  threat_level      text not null default 'normal'
                    check (threat_level in ('normal', 'distress', 'crisis')),
  timestamp         timestamptz not null default now()
);

create index if not exists messages_session_id_idx on messages(session_id);
create index if not exists messages_timestamp_idx  on messages(timestamp);

-- ── Audit logs ────────────────────────────────────────────────
create table if not exists audit_logs (
  id           uuid primary key default gen_random_uuid(),
  session_id   text not null,   -- anonymized (SHA-256 hash), not a FK
  event_type   text not null,   -- 'crisis_detected' | 'session_start' | etc.
  metadata     jsonb,
  created_at   timestamptz not null default now()
);
