import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Subscribe to real-time events on call_logs, appointments, usage_tracking, notifications.
 * Invalidates relevant queries and shows user-facing toasts.
 */
export function useDashboardRealtime() {
  const queryClient = useQueryClient();
  const fallbackRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const disconnectedAtRef = useRef<number | null>(null);

  useEffect(() => {
    const channel = supabase
      .channel("dashboard-realtime")
      // ── call_logs INSERT ──
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "call_logs" },
        (payload) => {
          const phone = (payload.new as Record<string, unknown>).caller_phone as string | undefined;
          toast.info(`New call received from ${phone ?? "unknown"}`);
          invalidateAll(queryClient);
        }
      )
      // ── call_logs UPDATE ──
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "call_logs" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["recent-calls"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard-kpis"] });
        }
      )
      // ── appointments ──
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "appointments" },
        (payload) => {
          const apptDate = (payload.new as Record<string, unknown>).appointment_date as string | undefined;
          toast.info(`New appointment scheduled${apptDate ? ` for ${apptDate}` : ""}`);
          queryClient.invalidateQueries({ queryKey: ["upcoming-appointments"] });
          queryClient.invalidateQueries({ queryKey: ["appointments"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "appointments" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["upcoming-appointments"] });
          queryClient.invalidateQueries({ queryKey: ["appointments"] });
        }
      )
      // ── usage_tracking ──
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "usage_tracking" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["billing-overview"] });
          queryClient.invalidateQueries({ queryKey: ["billing-usage-details"] });
          queryClient.invalidateQueries({ queryKey: ["daily-usage-chart"] });
        }
      )
      // ── notifications ──
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          const title = (payload.new as Record<string, unknown>).title as string | undefined;
          const type = (payload.new as Record<string, unknown>).type as string | undefined;
          if (title) toast.info(title);
          queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
          queryClient.invalidateQueries({ queryKey: ["notifications-recent"] });
          queryClient.invalidateQueries({ queryKey: ["notifications-list"] });
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          disconnectedAtRef.current = null;
          if (fallbackRef.current) {
            clearInterval(fallbackRef.current);
            fallbackRef.current = null;
          }
        } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
          if (!disconnectedAtRef.current) disconnectedAtRef.current = Date.now();
          // Fallback to polling after 30s of disconnection
          const elapsed = Date.now() - (disconnectedAtRef.current ?? Date.now());
          if (elapsed > 30_000 && !fallbackRef.current) {
            fallbackRef.current = setInterval(() => {
              invalidateAll(queryClient);
            }, 30_000);
          }
        }
      });

    return () => {
      supabase.removeChannel(channel);
      if (fallbackRef.current) {
        clearInterval(fallbackRef.current);
        fallbackRef.current = null;
      }
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
  qc.invalidateQueries({ queryKey: ["daily-usage-chart"] });
  qc.invalidateQueries({ queryKey: ["upcoming-appointments"] });
}
