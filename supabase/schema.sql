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

-- ── Doctors ───────────────────────────────────────────────────
create table if not exists doctors (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  full_name        text not null,
  specialization   text default 'General CBT Therapist',
  bio              text,
  experience_years int default 0,
  available        boolean default true,
  avatar_url       text,
  created_at       timestamptz not null default now()
);

create unique index if not exists doctors_user_id_idx on doctors(user_id);

-- ── Appointments ──────────────────────────────────────────────
create table if not exists appointments (
  id            uuid primary key default gen_random_uuid(),
  doctor_id     uuid not null references doctors(id) on delete cascade,
  patient_id    uuid references auth.users(id) on delete set null,
  patient_name  text not null,
  patient_email text not null,
  date          date not null,
  time_slot     text not null,
  status        text not null default 'pending'
                check (status in ('pending','confirmed','completed','cancelled')),
  notes         text,
  created_at    timestamptz not null default now()
);

create index if not exists appointments_doctor_id_idx  on appointments(doctor_id);
create index if not exists appointments_patient_id_idx on appointments(patient_id);
create index if not exists appointments_date_idx       on appointments(date);

-- ── Direct Messages ───────────────────────────────────────────
create table if not exists direct_messages (
  id            uuid primary key default gen_random_uuid(),
  sender_id     uuid not null references auth.users(id) on delete cascade,
  receiver_id   uuid not null references auth.users(id) on delete cascade,
  content       text not null,
  timestamp     timestamptz not null default now()
);

create index if not exists dm_sender_receiver_idx on direct_messages(sender_id, receiver_id);
create index if not exists dm_timestamp_idx        on direct_messages(timestamp);
