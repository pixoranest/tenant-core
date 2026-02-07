
-- 1. client_features
CREATE TABLE public.client_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE UNIQUE,
  call_recordings_access BOOLEAN DEFAULT FALSE,
  call_transcripts BOOLEAN DEFAULT FALSE,
  realtime_monitoring BOOLEAN DEFAULT FALSE,
  analytics_dashboard BOOLEAN DEFAULT FALSE,
  data_export BOOLEAN DEFAULT FALSE,
  api_access BOOLEAN DEFAULT FALSE,
  calendar_integration BOOLEAN DEFAULT FALSE,
  custom_branding BOOLEAN DEFAULT FALSE,
  max_concurrent_calls INT DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. client_integrations
CREATE TABLE public.client_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  integration_type VARCHAR(50) NOT NULL,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  status VARCHAR(20) DEFAULT 'configured',
  last_sync TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (client_id, integration_type)
);

-- 3. client_notifications
CREATE TABLE public.client_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE UNIQUE,
  email_daily_summary BOOLEAN DEFAULT FALSE,
  email_weekly_report BOOLEAN DEFAULT FALSE,
  email_low_balance BOOLEAN DEFAULT FALSE,
  email_call_failure BOOLEAN DEFAULT FALSE,
  sms_notifications BOOLEAN DEFAULT FALSE,
  webhook_notifications BOOLEAN DEFAULT FALSE,
  webhook_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_client_integrations_client ON public.client_integrations(client_id);
CREATE INDEX idx_client_integrations_type ON public.client_integrations(integration_type);

-- Updated_at triggers
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

CREATE TRIGGER trg_client_features_updated_at BEFORE UPDATE ON public.client_features
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_client_integrations_updated_at BEFORE UPDATE ON public.client_integrations
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_client_notifications_updated_at BEFORE UPDATE ON public.client_notifications
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-insert defaults on client creation
CREATE OR REPLACE FUNCTION public.create_client_defaults()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  INSERT INTO public.client_features (client_id) VALUES (NEW.id);
  INSERT INTO public.client_notifications (client_id) VALUES (NEW.id);
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_create_client_defaults AFTER INSERT ON public.clients
FOR EACH ROW EXECUTE FUNCTION public.create_client_defaults();

-- RLS: client_features
ALTER TABLE public.client_features ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_all_client_features" ON public.client_features
FOR ALL USING ((get_user_role(auth.uid()))::text = 'super_admin'::text)
WITH CHECK ((get_user_role(auth.uid()))::text = 'super_admin'::text);

CREATE POLICY "client_select_own_features" ON public.client_features
FOR SELECT USING (client_id = get_user_client_id(auth.uid()));

-- RLS: client_integrations
ALTER TABLE public.client_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_all_client_integrations" ON public.client_integrations
FOR ALL USING ((get_user_role(auth.uid()))::text = 'super_admin'::text)
WITH CHECK ((get_user_role(auth.uid()))::text = 'super_admin'::text);

CREATE POLICY "client_select_own_integrations" ON public.client_integrations
FOR SELECT USING (client_id = get_user_client_id(auth.uid()));

-- RLS: client_notifications
ALTER TABLE public.client_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_all_client_notifications" ON public.client_notifications
FOR ALL USING ((get_user_role(auth.uid()))::text = 'super_admin'::text)
WITH CHECK ((get_user_role(auth.uid()))::text = 'super_admin'::text);

CREATE POLICY "client_select_own_notifications" ON public.client_notifications
FOR SELECT USING (client_id = get_user_client_id(auth.uid()));

-- Backfill defaults for existing clients
INSERT INTO public.client_features (client_id)
SELECT id FROM public.clients
ON CONFLICT (client_id) DO NOTHING;

INSERT INTO public.client_notifications (client_id)
SELECT id FROM public.clients
ON CONFLICT (client_id) DO NOTHING;
