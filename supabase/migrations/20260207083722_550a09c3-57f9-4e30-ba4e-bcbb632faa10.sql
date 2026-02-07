DROP VIEW IF EXISTS public.daily_call_stats;

CREATE VIEW public.daily_call_stats
WITH (security_invoker = true)
AS
SELECT
  client_id,
  DATE(call_timestamp) AS call_date,
  COUNT(*) AS total_calls,
  SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_calls,
  SUM(CASE WHEN status = 'missed' THEN 1 ELSE 0 END) AS missed_calls,
  SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed_calls,
  SUM(duration) AS total_duration_seconds,
  AVG(duration) AS avg_duration_seconds,
  SUM(cost) AS total_cost
FROM public.call_logs
WHERE archived = FALSE
GROUP BY client_id, DATE(call_timestamp);