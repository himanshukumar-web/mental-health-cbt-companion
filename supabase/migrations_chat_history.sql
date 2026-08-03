-- Migration for Chat Sessions & Messages Persistence

CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    persona TEXT DEFAULT 'cbt',
    mood_score INTEGER,
    started_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    threat_level TEXT DEFAULT 'normal',
    timestamp TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_session_id ON public.messages(session_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON public.messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON public.messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions(user_id);

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Allow public / authenticated access policies
CREATE POLICY "Allow all access to sessions" ON public.sessions FOR ALL USING (true);
CREATE POLICY "Allow all access to messages" ON public.messages FOR ALL USING (true);
