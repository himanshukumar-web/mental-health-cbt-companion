-- ============================================================
-- Row Level Security — run AFTER schema.sql
-- ============================================================

-- Enable RLS on all tables
alter table sessions   enable row level security;
alter table messages   enable row level security;
alter table audit_logs enable row level security;

-- ── Sessions policies ─────────────────────────────────────────
-- Authenticated users can only see their own sessions
create policy "Users see own sessions"
  on sessions for select
  using (auth.uid() = user_id);

create policy "Users insert own sessions"
  on sessions for insert
  with check (auth.uid() = user_id or user_id is null);

-- Service role bypasses RLS (used by backend)
-- No policy needed — service_role key bypasses RLS by default

-- ── Messages policies ─────────────────────────────────────────
-- Users can read messages from their own sessions
create policy "Users read own messages"
  on messages for select
  using (
    session_id in (
      select id from sessions where user_id = auth.uid()
    )
  );

create policy "Users insert own messages"
  on messages for insert
  with check (
    session_id in (
      select id from sessions where user_id = auth.uid() or user_id is null
    )
  );

-- ── Audit logs ────────────────────────────────────────────────
-- Only the backend service role can write audit logs;
-- no public read access.
create policy "No public audit log access"
  on audit_logs for all
  using (false);
