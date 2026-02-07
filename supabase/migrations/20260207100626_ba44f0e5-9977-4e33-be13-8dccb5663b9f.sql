
-- Add reminder tracking columns to appointments
ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS reminder_24h_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS reminder_24h_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS reminder_2h_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS reminder_2h_sent_at TIMESTAMPTZ;

-- Add automation control columns to client_integrations
ALTER TABLE public.client_integrations
ADD COLUMN IF NOT EXISTS paused BOOLEAN DEFAULT FALSE;

-- Extend sync_logs with action_type for broader automation logging
ALTER TABLE public.sync_logs
ADD COLUMN IF NOT EXISTS action_type VARCHAR(50) DEFAULT 'sync';

-- Index for reminder queries
CREATE INDEX IF NOT EXISTS idx_appointments_reminder_status
ON public.appointments (status, appointment_date, reminder_24h_sent, reminder_2h_sent);
