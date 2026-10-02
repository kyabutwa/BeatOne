-- BeatOne canonical session secret verifier
-- Migration ID: beatone-canonical-session-token-2026-10-02
BEGIN;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS session_token_hash text;
CREATE UNIQUE INDEX IF NOT EXISTS idx_sessions_session_token_hash ON public.sessions(session_token_hash) WHERE session_token_hash IS NOT NULL;
INSERT INTO public.zalagren_schema_migrations (id)
SELECT 'beatone-canonical-session-token-2026-10-02'
WHERE NOT EXISTS (SELECT 1 FROM public.zalagren_schema_migrations WHERE id='beatone-canonical-session-token-2026-10-02');
COMMIT;
