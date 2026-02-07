
-- 1️⃣ Extend appointments table
ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS duration_minutes INT DEFAULT 30,
ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'voice_agent',
ADD COLUMN IF NOT EXISTS google_event_id TEXT,
ADD COLUMN IF NOT EXISTS calcom_booking_id TEXT,
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS no_show_at TIMESTAMPTZ;

-- 2️⃣ Indexes for calendar & analytics performance
CREATE INDEX IF NOT EXISTS idx_appointments_client_date
ON public.appointments (client_id, appointment_date);

CREATE INDEX IF NOT EXISTS idx_appointments_status
ON public.appointments (status);

CREATE INDEX IF NOT EXISTS idx_appointments_source
ON public.appointments (source);

-- 3️⃣ RLS - add client update policy (read + super_admin already exist)
CREATE POLICY "client_update_own_appointments"
ON public.appointments
FOR UPDATE
USING (client_id = get_user_client_id(auth.uid()))
WITH CHECK (client_id = get_user_client_id(auth.uid()));

-- 4️⃣ Sync Logs Table
CREATE TABLE IF NOT EXISTS public.sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  integration_type VARCHAR(50),
  status VARCHAR(20),
  records_synced INT DEFAULT 0,
  error_message TEXT,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "client_read_own_sync_logs"
ON public.sync_logs
FOR SELECT
USING (client_id = get_user_client_id(auth.uid()));

CREATE POLICY "super_admin_all_sync_logs"
ON public.sync_logs
FOR ALL
USING ((get_user_role(auth.uid()))::text = 'super_admin'::text)
WITH CHECK ((get_user_role(auth.uid()))::text = 'super_admin'::text);

CREATE INDEX IF NOT EXISTS idx_sync_logs_client
ON public.sync_logs (client_id);

CREATE INDEX IF NOT EXISTS idx_sync_logs_integration
ON public.sync_logs (integration_type);

-- 5️⃣ Appointment Analytics View
CREATE OR REPLACE VIEW public.appointment_stats_daily
WITH (security_invoker = true) AS
SELECT
  client_id,
  appointment_date,
  COUNT(*) AS total_appointments,
  COUNT(*) FILTER (WHERE status IN ('completed', 'confirmed')) AS attended,
  COUNT(*) FILTER (WHERE status = 'no_show') AS no_shows,
  COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled,
  AVG(duration_minutes) AS avg_duration_minutes
FROM public.appointments
GROUP BY client_id, appointment_date;
