
-- Voice agents table
CREATE TABLE public.voice_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100),
  omnidimension_agent_id VARCHAR(255) UNIQUE,
  description TEXT,
  greeting_message TEXT,
  system_prompt TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.voice_agents ENABLE ROW LEVEL SECURITY;

-- Client-agent assignments table
CREATE TABLE public.client_agent_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  agent_id UUID REFERENCES public.voice_agents(id) ON DELETE CASCADE NOT NULL,
  phone_number VARCHAR(20),
  status VARCHAR(20) DEFAULT 'active',
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (client_id, agent_id)
);

ALTER TABLE public.client_agent_assignments ENABLE ROW LEVEL SECURITY;

-- RLS: voice_agents
CREATE POLICY "super_admin_all_voice_agents"
ON public.voice_agents
FOR ALL
USING (get_user_role(auth.uid()) = 'super_admin')
WITH CHECK (get_user_role(auth.uid()) = 'super_admin');

CREATE POLICY "client_select_assigned_agents"
ON public.voice_agents
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.client_agent_assignments caa
    WHERE caa.agent_id = voice_agents.id
      AND caa.client_id = get_user_client_id(auth.uid())
      AND caa.status = 'active'
  )
);

-- RLS: client_agent_assignments
CREATE POLICY "super_admin_all_assignments"
ON public.client_agent_assignments
FOR ALL
USING (get_user_role(auth.uid()) = 'super_admin')
WITH CHECK (get_user_role(auth.uid()) = 'super_admin');

CREATE POLICY "client_select_own_assignments"
ON public.client_agent_assignments
FOR SELECT
USING (client_id = get_user_client_id(auth.uid()));

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_voice_agents_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_voice_agents_updated_at ON public.voice_agents;
CREATE TRIGGER trg_set_voice_agents_updated_at
BEFORE UPDATE ON public.voice_agents
FOR EACH ROW
EXECUTE FUNCTION public.set_voice_agents_updated_at();
