
-- 1. Create usage_tracking table
CREATE TABLE public.usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id),
  billing_cycle_start DATE NOT NULL,
  billing_cycle_end DATE NOT NULL,
  total_calls INTEGER DEFAULT 0,
  total_minutes NUMERIC DEFAULT 0,
  total_cost NUMERIC DEFAULT 0,
  overage_minutes NUMERIC DEFAULT 0,
  overage_cost NUMERIC DEFAULT 0,
  status VARCHAR DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create invoices table
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id),
  invoice_number VARCHAR NOT NULL,
  billing_period_start DATE,
  billing_period_end DATE,
  subtotal NUMERIC DEFAULT 0,
  tax NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0,
  status VARCHAR DEFAULT 'draft',
  due_date DATE,
  paid_at TIMESTAMPTZ,
  currency VARCHAR(10) DEFAULT 'INR',
  gst_number VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create payment_methods table
CREATE TABLE public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id),
  type VARCHAR NOT NULL,
  label VARCHAR,
  last_four VARCHAR(4),
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Indexes for usage_tracking
CREATE INDEX idx_usage_tracking_client_status ON public.usage_tracking (client_id, status);
CREATE INDEX idx_usage_tracking_billing_cycle ON public.usage_tracking (billing_cycle_start, billing_cycle_end);

-- 5. Indexes for invoices
CREATE INDEX idx_invoices_client ON public.invoices (client_id);
CREATE INDEX idx_invoices_status ON public.invoices (status);
CREATE INDEX idx_invoices_due_date ON public.invoices (due_date);

-- 6. Updated_at triggers
CREATE TRIGGER set_usage_tracking_updated_at
  BEFORE UPDATE ON public.usage_tracking
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 7. RLS for usage_tracking
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "client_read_own_usage"
  ON public.usage_tracking FOR SELECT
  USING (client_id = get_user_client_id(auth.uid()));

CREATE POLICY "super_admin_all_usage"
  ON public.usage_tracking FOR ALL
  USING ((get_user_role(auth.uid()))::text = 'super_admin')
  WITH CHECK ((get_user_role(auth.uid()))::text = 'super_admin');

-- 8. RLS for invoices
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "client_read_own_invoices"
  ON public.invoices FOR SELECT
  USING (client_id = get_user_client_id(auth.uid()));

CREATE POLICY "super_admin_all_invoices"
  ON public.invoices FOR ALL
  USING ((get_user_role(auth.uid()))::text = 'super_admin')
  WITH CHECK ((get_user_role(auth.uid()))::text = 'super_admin');

-- 9. RLS for payment_methods
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "client_manage_own_payment_methods"
  ON public.payment_methods FOR ALL
  USING (client_id = get_user_client_id(auth.uid()))
  WITH CHECK (client_id = get_user_client_id(auth.uid()));

CREATE POLICY "super_admin_all_payment_methods"
  ON public.payment_methods FOR ALL
  USING ((get_user_role(auth.uid()))::text = 'super_admin')
  WITH CHECK ((get_user_role(auth.uid()))::text = 'super_admin');
