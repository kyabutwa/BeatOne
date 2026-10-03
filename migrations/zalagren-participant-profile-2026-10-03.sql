-- Zalagren persistent participant profile foundation
-- Profile photo is account profile data, not legal-identity evidence.
CREATE TABLE IF NOT EXISTS public.participant_profiles (
  id TEXT PRIMARY KEY,
  participant_id TEXT NOT NULL UNIQUE REFERENCES public.participants(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_data TEXT,
  avatar_mime TEXT,
  avatar_updated_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS participant_profiles_participant_idx
  ON public.participant_profiles(participant_id);
