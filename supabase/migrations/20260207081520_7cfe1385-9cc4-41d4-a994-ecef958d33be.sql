
-- 1. EXTEND call_logs TABLE
ALTER TABLE public.call_logs
  ADD COLUMN recording_url TEXT,
  ADD COLUMN transcript_url TEXT,
  ADD COLUMN transcript_text TEXT,
  ADD COLUMN cost DECIMAL(10,4),
  ADD COLUMN execution_status VARCHAR(50) DEFAULT 'completed',
  ADD COLUMN archived BOOLEAN DEFAULT FALSE,
  ADD COLUMN archived_at TIMESTAMPTZ,
  ADD COLUMN external_provider VARCHAR(50) DEFAULT 'omnidimension';

-- 2. INDEXES
CREATE INDEX idx_call_logs_status ON public.call_logs (status);
CREATE INDEX idx_call_logs_execution_status ON public.call_logs (execution_status);
CREATE INDEX idx_call_logs_archived ON public.call_logs (archived);

-- 3. STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public)
VALUES ('call-recordings', 'call-recordings', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('call-transcripts', 'call-transcripts', false)
ON CONFLICT (id) DO NOTHING;

-- 4. STORAGE RLS
DROP POLICY IF EXISTS "Clients read own recordings" ON storage.objects;
DROP POLICY IF EXISTS "Clients read own transcripts" ON storage.objects;

CREATE POLICY "super_admin_manage_recordings"
ON storage.objects FOR ALL
USING (bucket_id = 'call-recordings' AND (get_user_role(auth.uid()))::text = 'super_admin')
WITH CHECK (bucket_id = 'call-recordings' AND (get_user_role(auth.uid()))::text = 'super_admin');

CREATE POLICY "super_admin_manage_transcripts"
ON storage.objects FOR ALL
USING (bucket_id = 'call-transcripts' AND (get_user_role(auth.uid()))::text = 'super_admin')
WITH CHECK (bucket_id = 'call-transcripts' AND (get_user_role(auth.uid()))::text = 'super_admin');

-- 5. CALL LOGS RLS
DROP POLICY IF EXISTS "client_read_own_call_logs" ON public.call_logs;
DROP POLICY IF EXISTS "super_admin_full_call_logs" ON public.call_logs;

CREATE POLICY "client_read_own_calls"
ON public.call_logs FOR SELECT
USING (client_id = get_user_client_id(auth.uid()) AND archived = FALSE);

CREATE POLICY "client_archive_own_calls"
ON public.call_logs FOR UPDATE
USING (client_id = get_user_client_id(auth.uid()))
WITH CHECK (client_id = get_user_client_id(auth.uid()));

CREATE POLICY "super_admin_full_call_logs"
ON public.call_logs FOR ALL
USING ((get_user_role(auth.uid()))::text = 'super_admin')
WITH CHECK ((get_user_role(auth.uid()))::text = 'super_admin');

-- 6. SAFE ARCHIVE FUNCTION
CREATE OR REPLACE FUNCTION public.archive_call_log(call_uuid UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.call_logs
  SET archived = TRUE, archived_at = NOW()
  WHERE id = call_uuid;
END;
$$;

-- 7. COST CALCULATION HELPER
CREATE OR REPLACE FUNCTION public.calculate_call_cost(
  duration_seconds INT,
  rate_per_minute DECIMAL
)
RETURNS DECIMAL
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT ROUND((duration_seconds / 60.0) * rate_per_minute, 4);
$$;

-- 8. PREVENT HARD DELETE
CREATE OR REPLACE FUNCTION public.prevent_call_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'Hard delete is not allowed on call_logs. Use archive instead.';
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_call_delete ON public.call_logs;
CREATE TRIGGER trg_prevent_call_delete
BEFORE DELETE ON public.call_logs
FOR EACH ROW
EXECUTE FUNCTION public.prevent_call_delete();
