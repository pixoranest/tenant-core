
-- 1. CALL LOGS
CREATE TABLE public.call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES public.voice_agents(id),
  call_id VARCHAR(255) UNIQUE NOT NULL,
  caller_phone VARCHAR(20),
  direction VARCHAR(10),
  duration INT,
  status VARCHAR(50),
  outcome VARCHAR(100),
  data_collected JSONB DEFAULT '{}'::jsonb,
  call_timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_call_logs_client_time ON public.call_logs (client_id, call_timestamp);
CREATE INDEX idx_call_logs_call_id ON public.call_logs (call_id);

-- 2. APPOINTMENTS
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  call_log_id UUID REFERENCES public.call_logs(id),
  customer_name VARCHAR(255),
  customer_phone VARCHAR(20),
  customer_email VARCHAR(255),
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  notes TEXT,
  status VARCHAR(50) DEFAULT 'scheduled',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_appointments_client_date ON public.appointments (client_id, appointment_date);

-- 3. RLS
ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "client_read_own_call_logs"
ON public.call_logs FOR SELECT
USING (client_id = get_user_client_id(auth.uid()));

CREATE POLICY "super_admin_full_call_logs"
ON public.call_logs FOR ALL
USING ((get_user_role(auth.uid()))::text = 'super_admin'::text)
WITH CHECK ((get_user_role(auth.uid()))::text = 'super_admin'::text);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "client_read_own_appointments"
ON public.appointments FOR SELECT
USING (client_id = get_user_client_id(auth.uid()));

CREATE POLICY "super_admin_full_appointments"
ON public.appointments FOR ALL
USING ((get_user_role(auth.uid()))::text = 'super_admin'::text)
WITH CHECK ((get_user_role(auth.uid()))::text = 'super_admin'::text);
