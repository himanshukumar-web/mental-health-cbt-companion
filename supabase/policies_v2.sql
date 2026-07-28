-- ============================================================
-- Row Level Security V2 — run AFTER migration_v2.sql
-- ============================================================

-- ── Mood Entries ─────────────────────────────────────────────
alter table mood_entries enable row level security;

create policy "Users manage own mood entries"
  on mood_entries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── Journal Entries ──────────────────────────────────────────
alter table journal_entries enable row level security;

create policy "Users manage own journal entries"
  on journal_entries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── Habit Definitions ────────────────────────────────────────
alter table habit_definitions enable row level security;

create policy "Users manage own habit definitions"
  on habit_definitions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── Habit Completions ────────────────────────────────────────
alter table habit_completions enable row level security;

create policy "Users manage own habit completions"
  on habit_completions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── CBT Worksheets ───────────────────────────────────────────
alter table cbt_worksheets enable row level security;

create policy "Users manage own CBT worksheets"
  on cbt_worksheets for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── Action Plans ─────────────────────────────────────────────
alter table action_plans enable row level security;

create policy "Users manage own action plans"
  on action_plans for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── User Profiles ────────────────────────────────────────────
alter table user_profiles enable row level security;

create policy "Users manage own profile"
  on user_profiles for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── Reminders ────────────────────────────────────────────────
alter table reminders enable row level security;

create policy "Users manage own reminders"
  on reminders for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── User Settings ────────────────────────────────────────────
alter table user_settings enable row level security;

create policy "Users manage own settings"
  on user_settings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── Notifications ────────────────────────────────────────────
alter table notifications enable row level security;

create policy "Users read own notifications"
  on notifications for select
  using (auth.uid() = user_id);

create policy "Users update own notifications"
  on notifications for update
  using (auth.uid() = user_id);
