
-- ===============================
-- Clients table
-- ===============================
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  email VARCHAR UNIQUE NOT NULL,
  phone VARCHAR,
  business_type VARCHAR,
  status VARCHAR NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Validation trigger instead of CHECK constraint for status
CREATE OR REPLACE FUNCTION public.validate_client_status()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status NOT IN ('active', 'inactive', 'suspended') THEN
    RAISE EXCEPTION 'Invalid client status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_client_status
  BEFORE INSERT OR UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.validate_client_status();

CREATE INDEX idx_clients_status ON public.clients(status);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- ===============================
-- Users table (profile linked to auth.users)
-- ===============================
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR UNIQUE NOT NULL,
  role VARCHAR NOT NULL DEFAULT 'client',
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  name VARCHAR,
  phone VARCHAR,
  is_active BOOLEAN NOT NULL DEFAULT true,
  two_factor_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login TIMESTAMPTZ
);

-- Validation trigger instead of CHECK constraint for role
CREATE OR REPLACE FUNCTION public.validate_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.role NOT IN ('super_admin', 'client') THEN
    RAISE EXCEPTION 'Invalid user role: %', NEW.role;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_user_role
  BEFORE INSERT OR UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.validate_user_role();

CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_client_id ON public.users(client_id);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ===============================
-- Helper functions (SECURITY DEFINER)
-- ===============================
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS VARCHAR
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.users WHERE id = _user_id
$$;

CREATE OR REPLACE FUNCTION public.get_user_client_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT client_id FROM public.users WHERE id = _user_id
$$;

-- ===============================
-- RLS POLICIES: users table
-- ===============================
CREATE POLICY "super_admin_all_users" ON public.users
  FOR ALL TO authenticated
  USING (public.get_user_role(auth.uid()) = 'super_admin')
  WITH CHECK (public.get_user_role(auth.uid()) = 'super_admin');

CREATE POLICY "client_select_own_user" ON public.users
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "client_update_own_user" ON public.users
  FOR UPDATE TO authenticated
  USING (
    id = auth.uid()
    AND public.get_user_role(auth.uid()) = 'client'
  )
  WITH CHECK (
    id = auth.uid()
    AND public.get_user_role(auth.uid()) = 'client'
    AND role = 'client'
    AND client_id = public.get_user_client_id(auth.uid())
  );

-- ===============================
-- RLS POLICIES: clients table
-- ===============================
CREATE POLICY "super_admin_all_clients" ON public.clients
  FOR ALL TO authenticated
  USING (public.get_user_role(auth.uid()) = 'super_admin')
  WITH CHECK (public.get_user_role(auth.uid()) = 'super_admin');

CREATE POLICY "client_select_own_client" ON public.clients
  FOR SELECT TO authenticated
  USING (id = public.get_user_client_id(auth.uid()));
