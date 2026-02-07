
ALTER TABLE public.call_logs
  ADD COLUMN IF NOT EXISTS tags TEXT[],
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS playback_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_played_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_call_logs_tags
  ON public.call_logs USING GIN (tags);

CREATE INDEX IF NOT EXISTS idx_call_logs_playback_count
  ON public.call_logs (playback_count);

CREATE INDEX IF NOT EXISTS idx_call_logs_last_played_at
  ON public.call_logs (last_played_at);
