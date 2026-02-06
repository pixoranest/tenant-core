
ALTER TABLE public.clients ADD COLUMN timezone VARCHAR(50) DEFAULT 'Asia/Kolkata';
ALTER TABLE public.clients ADD COLUMN trial_end_date TIMESTAMP;
ALTER TABLE public.clients ADD COLUMN billing_plan VARCHAR(50) DEFAULT 'payg';
ALTER TABLE public.clients ADD COLUMN rate_per_minute DECIMAL(10,4) DEFAULT 2.5;
ALTER TABLE public.clients ADD COLUMN monthly_allowance INT DEFAULT 0;
ALTER TABLE public.clients ADD COLUMN overage_rate DECIMAL(10,4) DEFAULT 3.0;
ALTER TABLE public.clients ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
