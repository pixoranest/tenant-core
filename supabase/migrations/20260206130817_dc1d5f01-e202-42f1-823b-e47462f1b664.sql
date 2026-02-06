
-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION public.set_clients_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_clients_updated_at ON public.clients;
CREATE TRIGGER trg_set_clients_updated_at
BEFORE UPDATE ON public.clients
FOR EACH ROW
EXECUTE FUNCTION public.set_clients_updated_at();

-- Change updated_at to TIMESTAMPTZ if it was plain TIMESTAMP
ALTER TABLE public.clients ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC';

-- Billing plan validation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'clients_billing_plan_check'
  ) THEN
    ALTER TABLE public.clients
    ADD CONSTRAINT clients_billing_plan_check
    CHECK (billing_plan IN ('payg', 'monthly_500', 'monthly_1000', 'enterprise'));
  END IF;
END $$;
