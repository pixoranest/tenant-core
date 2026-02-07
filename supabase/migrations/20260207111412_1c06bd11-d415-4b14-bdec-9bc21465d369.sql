
-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  type VARCHAR NOT NULL DEFAULT 'system',
  title VARCHAR NOT NULL,
  message TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  link VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Client can read own notifications
CREATE POLICY "client_read_own_notifications"
ON public.notifications
FOR SELECT
USING (client_id = get_user_client_id(auth.uid()));

-- Client can update own notifications (mark read)
CREATE POLICY "client_update_own_notifications"
ON public.notifications
FOR UPDATE
USING (client_id = get_user_client_id(auth.uid()));

-- Client can delete own notifications
CREATE POLICY "client_delete_own_notifications"
ON public.notifications
FOR DELETE
USING (client_id = get_user_client_id(auth.uid()));

-- Super admin full access
CREATE POLICY "super_admin_all_notifications"
ON public.notifications
FOR ALL
USING ((get_user_role(auth.uid()))::text = 'super_admin'::text)
WITH CHECK ((get_user_role(auth.uid()))::text = 'super_admin'::text);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Index for quick lookups
CREATE INDEX idx_notifications_client_unread ON public.notifications(client_id, is_read, created_at DESC);
