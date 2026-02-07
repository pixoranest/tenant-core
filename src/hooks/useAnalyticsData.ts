import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import {
  subDays,
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  subMonths,
  format,
  eachDayOfInterval,
  getDay,
  getHours,
} from "date-fns";

export type AnalyticsRange = "7d" | "30d" | "90d" | "this_month" | "last_month" | "custom";

export function getDateRange(range: AnalyticsRange, customFrom?: Date, customTo?: Date) {
  const now = new Date();
  switch (range) {
    case "7d":
      return { from: startOfDay(subDays(now, 6)), to: endOfDay(now) };
    case "30d":
      return { from: startOfDay(subDays(now, 29)), to: endOfDay(now) };
    case "90d":
      return { from: startOfDay(subDays(now, 89)), to: endOfDay(now) };
    case "this_month":
      return { from: startOfMonth(now), to: endOfDay(now) };
    case "last_month": {
      const prev = subMonths(now, 1);
      return { from: startOfMonth(prev), to: endOfMonth(prev) };
    }
    case "custom":
      return {
        from: customFrom ? startOfDay(customFrom) : startOfDay(subDays(now, 29)),
        to: customTo ? endOfDay(customTo) : endOfDay(now),
      };
  }
}

function getPreviousPeriod(from: Date, to: Date) {
  const diff = to.getTime() - from.getTime();
  return { from: new Date(from.getTime() - diff), to: new Date(from.getTime() - 1) };
}

interface CallRow {
  call_timestamp: string;
  duration: number | null;
  status: string | null;
  outcome: string | null;
  cost: number | null;
  data_collected: Record<string, unknown> | null;
}

export function useAnalyticsTopMetrics(range: AnalyticsRange, compare: boolean) {
  const { userProfile } = useAuth();
  const clientId = userProfile?.client_id;
  const { from, to } = getDateRange(range);

  return useQuery({
    queryKey: ["analytics-top-metrics", clientId, range, compare],
    enabled: !!clientId,
    queryFn: async () => {
      const { data: current } = await supabase
        .from("call_logs")
        .select("call_timestamp, duration, status, cost")
        .eq("client_id", clientId!)
        .eq("archived", false)
        .gte("call_timestamp", from.toISOString())
        .lte("call_timestamp", to.toISOString());

      const rows = current ?? [];
      const totalCalls = rows.length;
      const totalMinutes = Math.round(rows.reduce((s, r) => s + (r.duration ?? 0), 0) / 60);
      const completed = rows.filter((r) => r.status === "completed").length;
      const successRate = totalCalls > 0 ? Math.round((completed / totalCalls) * 1000) / 10 : 0;
      const avgDuration = totalCalls > 0 ? Math.round(rows.reduce((s, r) => s + (r.duration ?? 0), 0) / totalCalls) : 0;

      // Sparkline data (last 7 buckets)
      const allDays = eachDayOfInterval({ start: from, end: to });
      const bucketSize = Math.max(1, Math.ceil(allDays.length / 7));
      const sparkCalls: number[] = [];
      const sparkMinutes: number[] = [];
      const sparkSuccess: number[] = [];
      const sparkDuration: number[] = [];
      for (let i = 0; i < allDays.length; i += bucketSize) {
        const slice = allDays.slice(i, i + bucketSize);
        const start = startOfDay(slice[0]);
        const end = endOfDay(slice[slice.length - 1]);
        const bucket = rows.filter((r) => {
          const t = new Date(r.call_timestamp);
          return t >= start && t <= end;
        });
        sparkCalls.push(bucket.length);
        sparkMinutes.push(Math.round(bucket.reduce((s, r) => s + (r.duration ?? 0), 0) / 60));
        const bc = bucket.filter((r) => r.status === "completed").length;
        sparkSuccess.push(bucket.length > 0 ? Math.round((bc / bucket.length) * 100) : 0);
        sparkDuration.push(bucket.length > 0 ? Math.round(bucket.reduce((s, r) => s + (r.duration ?? 0), 0) / bucket.length) : 0);
      }

      let trends = { calls: null as number | null, minutes: null as number | null, success: null as number | null, duration: null as number | null };

      if (compare) {
        const prev = getPreviousPeriod(from, to);
        const { data: prevData } = await supabase
          .from("call_logs")
          .select("duration, status")
          .eq("client_id", clientId!)
          .eq("archived", false)
          .gte("call_timestamp", prev.from.toISOString())
          .lte("call_timestamp", prev.to.toISOString());
        const pr = prevData ?? [];
        const pTotal = pr.length;
        const pMinutes = Math.round(pr.reduce((s, r) => s + (r.duration ?? 0), 0) / 60);
        const pCompleted = pr.filter((r) => r.status === "completed").length;
        const pSuccess = pTotal > 0 ? Math.round((pCompleted / pTotal) * 1000) / 10 : 0;
        const pAvgDur = pTotal > 0 ? Math.round(pr.reduce((s, r) => s + (r.duration ?? 0), 0) / pTotal) : 0;

        const pct = (cur: number, prev: number) => (prev > 0 ? Math.round(((cur - prev) / prev) * 1000) / 10 : null);
        trends = {
          calls: pct(totalCalls, pTotal),
          minutes: pct(totalMinutes, pMinutes),
          success: pSuccess > 0 ? Math.round((successRate - pSuccess) * 10) / 10 : null,
          duration: pct(avgDuration, pAvgDur),
        };
      }

      return { totalCalls, totalMinutes, successRate, avgDuration, sparkCalls, sparkMinutes, sparkSuccess, sparkDuration, trends };
    },
  });
}

export function useCallVolumeChart(range: AnalyticsRange) {
  const { userProfile } = useAuth();
  const clientId = userProfile?.client_id;
  const { from, to } = getDateRange(range);

  return useQuery({
    queryKey: ["analytics-volume-chart", clientId, range],
    enabled: !!clientId,
    queryFn: async () => {
      const { data } = await supabase
        .from("call_logs")
        .select("call_timestamp, status")
        .eq("client_id", clientId!)
        .eq("archived", false)
        .gte("call_timestamp", from.toISOString())
        .lte("call_timestamp", to.toISOString());

      const rows = data ?? [];
      const allDays = eachDayOfInterval({ start: startOfDay(from), end: startOfDay(to) });
      const chartData = allDays.map((d) => {
        const key = format(d, "yyyy-MM-dd");
        const dayRows = rows.filter((r) => format(new Date(r.call_timestamp), "yyyy-MM-dd") === key);
        return {
          date: key,
          label: format(d, "MMM d"),
          total: dayRows.length,
          completed: dayRows.filter((r) => r.status === "completed").length,
          failed: dayRows.filter((r) => r.status === "failed" || r.status === "missed").length,
        };
      });

      const peakDay = chartData.reduce((best, d) => (d.total > best.total ? d : best), chartData[0] ?? { date: "", label: "", total: 0 });

      return { chartData, peakDay };
    },
  });
}

export function useStatusDistribution(range: AnalyticsRange) {
  const { userProfile } = useAuth();
  const clientId = userProfile?.client_id;
  const { from, to } = getDateRange(range);

  return useQuery({
    queryKey: ["analytics-status-dist", clientId, range],
    enabled: !!clientId,
    queryFn: async () => {
      const { data } = await supabase
        .from("call_logs")
        .select("status, duration")
        .eq("client_id", clientId!)
        .eq("archived", false)
        .gte("call_timestamp", from.toISOString())
        .lte("call_timestamp", to.toISOString());

      const rows = data ?? [];
      const statusMap: Record<string, number> = {};
      rows.forEach((r) => {
        const s = r.status ?? "unknown";
        statusMap[s] = (statusMap[s] ?? 0) + 1;
      });

      const distribution = Object.entries(statusMap).map(([name, value]) => ({ name, value }));
      return { distribution, total: rows.length };
    },
  });
}

export function useAvgDurationTrend(range: AnalyticsRange) {
  const { userProfile } = useAuth();
  const clientId = userProfile?.client_id;
  const { from, to } = getDateRange(range);

  return useQuery({
    queryKey: ["analytics-avg-duration", clientId, range],
    enabled: !!clientId,
    queryFn: async () => {
      const { data } = await supabase
        .from("call_logs")
        .select("call_timestamp, duration")
        .eq("client_id", clientId!)
        .eq("archived", false)
        .gte("call_timestamp", from.toISOString())
        .lte("call_timestamp", to.toISOString());

      const rows = data ?? [];
      const allDays = eachDayOfInterval({ start: startOfDay(from), end: startOfDay(to) });
      const overallAvg = rows.length > 0 ? rows.reduce((s, r) => s + (r.duration ?? 0), 0) / rows.length / 60 : 0;

      const chartData = allDays.map((d) => {
        const key = format(d, "yyyy-MM-dd");
        const dayRows = rows.filter((r) => format(new Date(r.call_timestamp), "yyyy-MM-dd") === key);
        const avg = dayRows.length > 0 ? dayRows.reduce((s, r) => s + (r.duration ?? 0), 0) / dayRows.length / 60 : 0;
        return { date: key, label: format(d, "MMM d"), avgMinutes: Math.round(avg * 10) / 10 };
      });

      return { chartData, overallAvg: Math.round(overallAvg * 10) / 10 };
    },
  });
}

export function useCallPatterns(range: AnalyticsRange) {
  const { userProfile } = useAuth();
  const clientId = userProfile?.client_id;
  const { from, to } = getDateRange(range);

  return useQuery({
    queryKey: ["analytics-patterns", clientId, range],
    enabled: !!clientId,
    queryFn: async () => {
      const { data } = await supabase
        .from("call_logs")
        .select("call_timestamp")
        .eq("client_id", clientId!)
        .eq("archived", false)
        .gte("call_timestamp", from.toISOString())
        .lte("call_timestamp", to.toISOString());

      const rows = data ?? [];

      // By hour
      const hourCounts = Array.from({ length: 24 }, (_, i) => ({ hour: i, label: `${i.toString().padStart(2, "0")}:00`, calls: 0 }));
      rows.forEach((r) => {
        const h = getHours(new Date(r.call_timestamp));
        hourCounts[h].calls++;
      });
      const topHours = [...hourCounts].sort((a, b) => b.calls - a.calls).slice(0, 3).map((h) => h.hour);

      // By day of week
      const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const dayCounts = dayNames.map((name, i) => ({ day: i, name, calls: 0 }));
      rows.forEach((r) => {
        const d = getDay(new Date(r.call_timestamp));
        dayCounts[d].calls++;
      });
      const sortedDays = [...dayCounts].sort((a, b) => b.calls - a.calls);

      const peakHour = hourCounts.reduce((best, h) => (h.calls > best.calls ? h : best), hourCounts[0]);
      const busiestDay = sortedDays[0];
      const slowestHours = [...hourCounts].sort((a, b) => a.calls - b.calls).slice(0, 3);

      return { hourCounts, topHours, dayCounts: sortedDays, peakHour, busiestDay, slowestHours };
    },
  });
}

export function useOutcomeDistribution(range: AnalyticsRange) {
  const { userProfile } = useAuth();
  const clientId = userProfile?.client_id;
  const { from, to } = getDateRange(range);

  return useQuery({
    queryKey: ["analytics-outcomes", clientId, range],
    enabled: !!clientId,
    queryFn: async () => {
      const { data } = await supabase
        .from("call_logs")
        .select("outcome, data_collected")
        .eq("client_id", clientId!)
        .eq("archived", false)
        .gte("call_timestamp", from.toISOString())
        .lte("call_timestamp", to.toISOString());

      const rows = data ?? [];
      const outcomeMap: Record<string, number> = {};
      rows.forEach((r) => {
        const o = r.outcome ?? "other";
        outcomeMap[o] = (outcomeMap[o] ?? 0) + 1;
      });
      const total = rows.length;
      const outcomes = Object.entries(outcomeMap)
        .map(([name, value]) => ({ name, value, pct: total > 0 ? Math.round((value / total) * 1000) / 10 : 0 }))
        .sort((a, b) => b.value - a.value);

      // Leads captured = calls with email or phone in data_collected
      const leadsCount = rows.filter((r) => {
        if (!r.data_collected) return false;
        const dc = r.data_collected as Record<string, unknown>;
        return dc.email || dc.phone;
      }).length;

      return { outcomes, total, leadsCount };
    },
  });
}

export function useAppointmentsCount(range: AnalyticsRange) {
  const { userProfile } = useAuth();
  const clientId = userProfile?.client_id;
  const { from, to } = getDateRange(range);

  return useQuery({
    queryKey: ["analytics-appointments", clientId, range],
    enabled: !!clientId,
    queryFn: async () => {
      const { count: totalCalls } = await supabase
        .from("call_logs")
        .select("*", { count: "exact", head: true })
        .eq("client_id", clientId!)
        .eq("archived", false)
        .gte("call_timestamp", from.toISOString())
        .lte("call_timestamp", to.toISOString());

      const { count: apptCount } = await supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .eq("client_id", clientId!)
        .gte("created_at", from.toISOString())
        .lte("created_at", to.toISOString());

      const conversionRate = (totalCalls ?? 0) > 0 ? Math.round(((apptCount ?? 0) / (totalCalls ?? 1)) * 1000) / 10 : 0;

      return { count: apptCount ?? 0, conversionRate };
    },
  });
}
