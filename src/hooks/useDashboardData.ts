import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { startOfDay, startOfMonth, subDays, format, eachDayOfInterval } from "date-fns";

export type DateRange = "7d" | "30d" | "90d" | "custom";

export function useDashboardKPIs() {
  const { userProfile } = useAuth();
  const clientId = userProfile?.client_id;

  return useQuery({
    queryKey: ["dashboard-kpis", clientId],
    enabled: !!clientId,
    refetchInterval: false,
    queryFn: async () => {
      const today = startOfDay(new Date());
      const yesterday = startOfDay(subDays(new Date(), 1));
      const monthStart = startOfMonth(new Date());

      // Today's calls
      const { count: todayCalls } = await supabase
        .from("call_logs")
        .select("*", { count: "exact", head: true })
        .eq("client_id", clientId!)
        .gte("call_timestamp", today.toISOString());

      // Yesterday's calls
      const { count: yesterdayCalls } = await supabase
        .from("call_logs")
        .select("*", { count: "exact", head: true })
        .eq("client_id", clientId!)
        .gte("call_timestamp", yesterday.toISOString())
        .lt("call_timestamp", today.toISOString());

      // Active (ongoing) calls
      const { count: activeCalls } = await supabase
        .from("call_logs")
        .select("*", { count: "exact", head: true })
        .eq("client_id", clientId!)
        .eq("status", "ongoing");

      // Minutes this month
      const { data: monthData } = await supabase
        .from("call_logs")
        .select("duration")
        .eq("client_id", clientId!)
        .gte("call_timestamp", monthStart.toISOString());

      const totalMinutes = Math.round(
        (monthData ?? []).reduce((sum, r) => sum + (r.duration ?? 0), 0) / 60
      );

      // Success rate
      const { count: totalAll } = await supabase
        .from("call_logs")
        .select("*", { count: "exact", head: true })
        .eq("client_id", clientId!);

      const { count: completedCount } = await supabase
        .from("call_logs")
        .select("*", { count: "exact", head: true })
        .eq("client_id", clientId!)
        .eq("status", "completed");

      const successRate =
        (totalAll ?? 0) > 0
          ? Math.round(((completedCount ?? 0) / (totalAll ?? 1)) * 1000) / 10
          : 0;

      const todayChange =
        (yesterdayCalls ?? 0) > 0
          ? Math.round(
              (((todayCalls ?? 0) - (yesterdayCalls ?? 0)) /
                (yesterdayCalls ?? 1)) *
                100
            )
          : null;

      return {
        todayCalls: todayCalls ?? 0,
        todayChange,
        activeCalls: activeCalls ?? 0,
        totalMinutes,
        successRate,
      };
    },
  });
}

export function useCallVolumeTrend(range: DateRange, customFrom?: Date, customTo?: Date) {
  const { userProfile } = useAuth();
  const clientId = userProfile?.client_id;

  const days = range === "7d" ? 7 : range === "30d" ? 30 : range === "90d" ? 90 : 30;
  const from = range === "custom" && customFrom ? customFrom : subDays(new Date(), days);
  const to = range === "custom" && customTo ? customTo : new Date();

  return useQuery({
    queryKey: ["call-volume-trend", clientId, range, from?.toISOString(), to?.toISOString()],
    enabled: !!clientId,
    queryFn: async () => {
      const { data } = await supabase
        .from("call_logs")
        .select("call_timestamp")
        .eq("client_id", clientId!)
        .gte("call_timestamp", startOfDay(from).toISOString())
        .lte("call_timestamp", to.toISOString());

      const countMap: Record<string, number> = {};
      (data ?? []).forEach((r) => {
        const key = format(new Date(r.call_timestamp), "yyyy-MM-dd");
        countMap[key] = (countMap[key] ?? 0) + 1;
      });

      const allDays = eachDayOfInterval({ start: startOfDay(from), end: startOfDay(to) });
      const chartData = allDays.map((d) => {
        const key = format(d, "yyyy-MM-dd");
        return { date: key, label: format(d, "MMM d"), calls: countMap[key] ?? 0 };
      });

      const peakDay = chartData.reduce(
        (best, d) => (d.calls > best.calls ? d : best),
        chartData[0] ?? { date: "", label: "", calls: 0 }
      );
      const totalCalls = chartData.reduce((s, d) => s + d.calls, 0);
      const avgPerDay = chartData.length > 0 ? Math.round((totalCalls / chartData.length) * 10) / 10 : 0;

      return { chartData, peakDay, totalCalls, avgPerDay };
    },
  });
}

export function useRecentCalls() {
  const { userProfile } = useAuth();
  const clientId = userProfile?.client_id;

  return useQuery({
    queryKey: ["recent-calls", clientId],
    enabled: !!clientId,
    queryFn: async () => {
      const { data } = await supabase
        .from("call_logs")
        .select("*")
        .eq("client_id", clientId!)
        .order("call_timestamp", { ascending: false })
        .limit(10);
      return data ?? [];
    },
  });
}

export function useUpcomingAppointments() {
  const { userProfile } = useAuth();
  const clientId = userProfile?.client_id;
  const today = format(new Date(), "yyyy-MM-dd");

  return useQuery({
    queryKey: ["upcoming-appointments", clientId],
    enabled: !!clientId,
    queryFn: async () => {
      const { data } = await supabase
        .from("appointments")
        .select("*")
        .eq("client_id", clientId!)
        .gte("appointment_date", today)
        .order("appointment_date", { ascending: true })
        .order("appointment_time", { ascending: true })
        .limit(5);
      return data ?? [];
    },
  });
}

export function useSystemStatus() {
  const { userProfile } = useAuth();
  const clientId = userProfile?.client_id;

  return useQuery({
    queryKey: ["system-status", clientId],
    enabled: !!clientId,
    queryFn: async () => {
      const { data: integrations } = await supabase
        .from("client_integrations")
        .select("integration_type, status")
        .eq("client_id", clientId!);

      const { data: assignments } = await supabase
        .from("client_agent_assignments")
        .select("id, status")
        .eq("client_id", clientId!)
        .eq("status", "active");

      // Last call time
      const { data: lastCall } = await supabase
        .from("call_logs")
        .select("call_timestamp")
        .eq("client_id", clientId!)
        .order("call_timestamp", { ascending: false })
        .limit(1);

      const integrationMap: Record<string, string> = {};
      (integrations ?? []).forEach((i) => {
        integrationMap[i.integration_type] = i.status ?? "inactive";
      });

      return {
        voiceAgent: {
          active: (assignments ?? []).length > 0,
          lastCallTime: lastCall?.[0]?.call_timestamp ?? null,
        },
        integrations: integrationMap,
      };
    },
  });
}
