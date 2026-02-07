import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfDay, endOfDay,
  format, subDays, differenceInDays,
} from "date-fns";

export type CalendarView = "month" | "week" | "day" | "list";
export type AppointmentStatus = "scheduled" | "confirmed" | "completed" | "cancelled" | "no_show";

const statusFilter: Record<string, string[]> = {
  upcoming: ["scheduled", "confirmed"],
  past: ["completed"],
  cancelled: ["cancelled"],
  "no_show": ["no_show"],
};

export function useAppointments(
  view: CalendarView,
  currentDate: Date,
  listFilter?: string
) {
  const { userProfile } = useAuth();
  const clientId = userProfile?.client_id;

  return useQuery({
    queryKey: ["appointments", clientId, view, currentDate.toISOString(), listFilter],
    enabled: !!clientId,
    queryFn: async () => {
      let from: Date, to: Date;
      if (view === "month") {
        from = startOfWeek(startOfMonth(currentDate));
        to = endOfWeek(endOfMonth(currentDate));
      } else if (view === "week") {
        from = startOfWeek(currentDate);
        to = endOfWeek(currentDate);
      } else if (view === "day") {
        from = startOfDay(currentDate);
        to = endOfDay(currentDate);
      } else {
        from = subDays(new Date(), 365);
        to = endOfDay(new Date());
      }

      let query = supabase
        .from("appointments")
        .select("*")
        .eq("client_id", clientId!)
        .gte("appointment_date", format(from, "yyyy-MM-dd"))
        .lte("appointment_date", format(to, "yyyy-MM-dd"))
        .order("appointment_date", { ascending: true })
        .order("appointment_time", { ascending: true });

      if (view === "list" && listFilter && statusFilter[listFilter]) {
        query = query.in("status", statusFilter[listFilter]);
      }
      if (view === "list") {
        query = query.limit(50);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAppointmentDetails(appointmentId: string | null) {
  return useQuery({
    queryKey: ["appointment-detail", appointmentId],
    enabled: !!appointmentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("id", appointmentId!)
        .single();
      if (error) throw error;

      let callLog = null;
      if (data.call_log_id) {
        const { data: cl } = await supabase
          .from("call_logs")
          .select("*")
          .eq("id", data.call_log_id)
          .single();
        callLog = cl;
      }

      return { appointment: data, callLog };
    },
  });
}

export function useUpdateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, unknown> }) => {
      const { error } = await supabase
        .from("appointments")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      qc.invalidateQueries({ queryKey: ["appointment-detail"] });
      qc.invalidateQueries({ queryKey: ["appointment-stats"] });
    },
  });
}

export function useAppointmentStats() {
  const { userProfile } = useAuth();
  const clientId = userProfile?.client_id;

  return useQuery({
    queryKey: ["appointment-stats", clientId],
    enabled: !!clientId,
    queryFn: async () => {
      const now = new Date();
      const thirtyAgo = subDays(now, 30);
      const sixtyAgo = subDays(now, 60);

      // Current period
      const { data: current } = await supabase
        .from("appointments")
        .select("*")
        .eq("client_id", clientId!)
        .gte("appointment_date", format(thirtyAgo, "yyyy-MM-dd"))
        .lte("appointment_date", format(now, "yyyy-MM-dd"));

      // Previous period
      const { data: previous } = await supabase
        .from("appointments")
        .select("id, status")
        .eq("client_id", clientId!)
        .gte("appointment_date", format(sixtyAgo, "yyyy-MM-dd"))
        .lt("appointment_date", format(thirtyAgo, "yyyy-MM-dd"));

      const curr = current ?? [];
      const prev = previous ?? [];

      const total = curr.length;
      const prevTotal = prev.length;
      const attended = curr.filter((a) => ["completed", "confirmed"].includes(a.status ?? "")).length;
      const noShows = curr.filter((a) => a.status === "no_show").length;
      const cancelled = curr.filter((a) => a.status === "cancelled").length;
      const showUpRate = total > 0 ? Math.round((attended / total) * 100) : 0;

      // This week
      const weekStart = startOfWeek(now);
      const thisWeek = curr.filter((a) => new Date(a.appointment_date) >= weekStart);

      // Avg lead time
      const leadTimes = curr
        .filter((a) => a.created_at)
        .map((a) => differenceInDays(new Date(a.appointment_date), new Date(a.created_at!)));
      const avgLeadTime = leadTimes.length > 0 ? Math.round(leadTimes.reduce((s, v) => s + v, 0) / leadTimes.length) : 0;

      // Status distribution
      const statusDist = [
        { name: "Scheduled", value: curr.filter((a) => a.status === "scheduled").length },
        { name: "Confirmed", value: attended },
        { name: "Cancelled", value: cancelled },
        { name: "No-show", value: noShows },
      ].filter((d) => d.value > 0);

      // Daily trend
      const dailyMap: Record<string, number> = {};
      curr.forEach((a) => {
        const key = a.appointment_date;
        dailyMap[key] = (dailyMap[key] ?? 0) + 1;
      });
      const dailyTrend = Object.entries(dailyMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, count]) => ({ date, label: format(new Date(date), "MMM d"), count }));

      // Hour distribution
      const hourMap: Record<number, number> = {};
      curr.forEach((a) => {
        if (a.appointment_time) {
          const h = parseInt(a.appointment_time.split(":")[0], 10);
          hourMap[h] = (hourMap[h] ?? 0) + 1;
        }
      });
      const hourDist = Object.entries(hourMap)
        .map(([h, count]) => ({ hour: `${parseInt(h)}:00`, count }))
        .sort((a, b) => a.hour.localeCompare(b.hour));

      return {
        total,
        prevTotal,
        attended,
        noShows,
        cancelled,
        showUpRate,
        thisWeek: thisWeek.length,
        avgLeadTime,
        statusDist,
        dailyTrend,
        hourDist,
      };
    },
  });
}

export function useSyncLogs() {
  const { userProfile } = useAuth();
  const clientId = userProfile?.client_id;

  return useQuery({
    queryKey: ["sync-logs", clientId],
    enabled: !!clientId,
    queryFn: async () => {
      const { data } = await supabase
        .from("sync_logs")
        .select("*")
        .eq("client_id", clientId!)
        .order("synced_at", { ascending: false })
        .limit(50);
      return data ?? [];
    },
  });
}

export function useIntegrationStatus() {
  const { userProfile } = useAuth();
  const clientId = userProfile?.client_id;

  return useQuery({
    queryKey: ["integration-status", clientId],
    enabled: !!clientId,
    queryFn: async () => {
      const { data } = await supabase
        .from("client_integrations")
        .select("*")
        .eq("client_id", clientId!)
        .in("integration_type", ["google_calendar", "cal_com"]);
      return data ?? [];
    },
  });
}
