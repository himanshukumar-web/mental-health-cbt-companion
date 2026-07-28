-- ============================================================
-- Sera CBT Companion — V2 Migration
-- Run this in the Supabase SQL editor AFTER schema.sql
-- ============================================================

-- ── Mood Entries ─────────────────────────────────────────────
create table if not exists mood_entries (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  date         date not null default current_date,
  mood_score   smallint not null check (mood_score between 1 and 5),
  mood_emoji   text not null default '😐',
  stress_level smallint check (stress_level between 0 and 10),
  anxiety_level smallint check (anxiety_level between 0 and 10),
  energy_level smallint check (energy_level between 0 and 10),
  sleep_hours  numeric(3,1) check (sleep_hours between 0 and 24),
  water_intake smallint check (water_intake between 0 and 20),
  exercise_done boolean default false,
  meditation_done boolean default false,
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  UNIQUE(user_id, date)
);

create index if not exists mood_entries_user_id_idx on mood_entries(user_id);
create index if not exists mood_entries_date_idx on mood_entries(date);
create index if not exists mood_entries_user_date_idx on mood_entries(user_id, date);

-- ── Journal Entries ──────────────────────────────────────────
create table if not exists journal_entries (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  title         text not null default '',
  content       text not null default '',
  content_html  text,
  sentiment     text check (sentiment in ('positive', 'negative', 'neutral', 'mixed')),
  sentiment_score numeric(4,3),
  emotions      jsonb default '{}',
  ai_summary    text,
  word_count    integer default 0,
  is_favorite   boolean default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists journal_user_id_idx on journal_entries(user_id);
create index if not exists journal_created_at_idx on journal_entries(created_at);
create index if not exists journal_sentiment_idx on journal_entries(sentiment);

-- ── Habit Definitions ────────────────────────────────────────
create table if not exists habit_definitions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  icon        text not null default '✅',
  color       text not null default '#22c55e',
  is_active   boolean default true,
  sort_order  smallint default 0,
  created_at  timestamptz not null default now()
);

create index if not exists habit_def_user_id_idx on habit_definitions(user_id);

-- ── Habit Completions ────────────────────────────────────────
create table if not exists habit_completions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  habit_definition_id uuid not null references habit_definitions(id) on delete cascade,
  date             date not null default current_date,
  completed        boolean default true,
  created_at       timestamptz not null default now(),
  UNIQUE(user_id, habit_definition_id, date)
);

create index if not exists habit_comp_user_date_idx on habit_completions(user_id, date);

-- ── CBT Worksheets ───────────────────────────────────────────
create table if not exists cbt_worksheets (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  situation           text not null,
  automatic_thought   text not null,
  emotion             text not null,
  emotion_intensity   smallint check (emotion_intensity between 0 and 100),
  thinking_errors     jsonb default '[]',
  alternative_thought text,
  action_plan         text,
  ai_generated        boolean default false,
  created_at          timestamptz not null default now()
);

create index if not exists cbt_ws_user_id_idx on cbt_worksheets(user_id);
create index if not exists cbt_ws_created_at_idx on cbt_worksheets(created_at);

-- ── Action Plans ─────────────────────────────────────────────
create table if not exists action_plans (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  session_id        text,
  breathing_exercise text,
  walking_goal      text,
  hydration_goal    text,
  meditation_rec    text,
  journal_prompt    text,
  sleep_rec         text,
  motivational_msg  text,
  created_at        timestamptz not null default now()
);

create index if not exists action_plan_user_id_idx on action_plans(user_id);

-- ── User Profiles ────────────────────────────────────────────
create table if not exists user_profiles (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null unique references auth.users(id) on delete cascade,
  display_name       text,
  avatar_url         text,
  age                smallint check (age between 10 and 120),
  gender             text check (gender in ('male', 'female', 'non-binary', 'prefer-not-to-say', null)),
  timezone           text default 'Asia/Kolkata',
  goals              jsonb default '[]',
  preferred_reminder_time text default '09:00',
  wellness_goals     text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists user_profile_user_id_idx on user_profiles(user_id);

-- ── Reminders ────────────────────────────────────────────────
create table if not exists reminders (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null unique references auth.users(id) on delete cascade,
  journal_enabled boolean default true,
  journal_time    text default '20:00',
  meditation_enabled boolean default true,
  meditation_time text default '07:00',
  water_enabled   boolean default true,
  water_interval  smallint default 60,
  sleep_enabled   boolean default true,
  sleep_time      text default '22:30',
  mood_enabled    boolean default true,
  mood_time       text default '21:00',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists reminders_user_id_idx on reminders(user_id);

-- ── User Settings ────────────────────────────────────────────
create table if not exists user_settings (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null unique references auth.users(id) on delete cascade,
  theme               text default 'dark' check (theme in ('light', 'dark', 'default')),
  notifications_enabled boolean default true,
  email_notifications boolean default false,
  language            text default 'en',
  data_sharing        boolean default false,
  analytics_enabled   boolean default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists user_settings_user_id_idx on user_settings(user_id);

-- ── Notifications table (was missing from original schema) ───
create table if not exists notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  type        text not null,
  title       text not null,
  message     text not null,
  link        text,
  is_read     boolean default false,
  created_at  timestamptz not null default now()
);

create index if not exists notif_user_id_idx on notifications(user_id);
create index if not exists notif_created_at_idx on notifications(created_at);
