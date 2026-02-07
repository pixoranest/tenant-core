import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Subscribe to real-time changes on call_logs and invalidate analytics queries.
 */
export function useAnalyticsRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("analytics-call-logs")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "call_logs" },
        () => {
          // Invalidate all analytics query keys
          queryClient.invalidateQueries({ queryKey: ["analytics-top-metrics"] });
          queryClient.invalidateQueries({ queryKey: ["analytics-volume-chart"] });
          queryClient.invalidateQueries({ queryKey: ["analytics-status-dist"] });
          queryClient.invalidateQueries({ queryKey: ["analytics-avg-duration"] });
          queryClient.invalidateQueries({ queryKey: ["analytics-patterns"] });
          queryClient.invalidateQueries({ queryKey: ["analytics-outcomes"] });
          queryClient.invalidateQueries({ queryKey: ["analytics-appointments"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
