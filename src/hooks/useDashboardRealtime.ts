import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Subscribe to real-time inserts on call_logs, appointments, and usage_tracking.
 * Invalidates all dashboard-related queries and shows a toast for new calls.
 */
export function useDashboardRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("dashboard-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "call_logs" },
        (payload) => {
          const phone = (payload.new as Record<string, unknown>).caller_phone as string | undefined;
          toast.info(`New call received from ${phone ?? "unknown"}`);
          invalidateAll(queryClient);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "appointments" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["upcoming-appointments"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "usage_tracking" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["billing-overview"] });
          queryClient.invalidateQueries({ queryKey: ["billing-usage-details"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}

function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["dashboard-kpis"] });
  qc.invalidateQueries({ queryKey: ["call-volume-trend"] });
  qc.invalidateQueries({ queryKey: ["recent-calls"] });
  qc.invalidateQueries({ queryKey: ["system-status"] });
  qc.invalidateQueries({ queryKey: ["analytics-top-metrics"] });
  qc.invalidateQueries({ queryKey: ["analytics-volume-chart"] });
  qc.invalidateQueries({ queryKey: ["billing-overview"] });
}
