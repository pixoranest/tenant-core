import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import {
  startOfMonth,
  endOfMonth,
  format,
  differenceInDays,
  eachDayOfInterval,
  startOfDay,
} from "date-fns";

// ─── Usage Overview ───
export function useBillingOverview() {
  const { userProfile } = useAuth();
  const clientId = userProfile?.client_id;

  return useQuery({
    queryKey: ["billing-overview", clientId],
    enabled: !!clientId,
    queryFn: async () => {
      const now = new Date();
      const cycleStart = startOfMonth(now);
      const cycleEnd = endOfMonth(now);
      const daysLeft = differenceInDays(cycleEnd, now);
      const prevCycleStart = startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1));
      const prevCycleEnd = endOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1));

      // Client billing config
      const { data: client } = await supabase
        .from("clients")
        .select("billing_plan, rate_per_minute, monthly_allowance, overage_rate, name")
        .eq("id", clientId!)
        .single();

      const ratePerMin = client?.rate_per_minute ?? 2.5;
      const allowance = client?.monthly_allowance ?? 0;
      const overageRate = client?.overage_rate ?? 3.0;

      // Current cycle calls
      const { data: currentCalls } = await supabase
        .from("call_logs")
        .select("duration, cost, agent_id")
        .eq("client_id", clientId!)
        .gte("call_timestamp", cycleStart.toISOString())
        .lte("call_timestamp", cycleEnd.toISOString());

      // Previous cycle calls
      const { data: prevCalls } = await supabase
        .from("call_logs")
        .select("duration, cost")
        .eq("client_id", clientId!)
        .gte("call_timestamp", prevCycleStart.toISOString())
        .lte("call_timestamp", prevCycleEnd.toISOString());

      const calls = currentCalls ?? [];
      const prev = prevCalls ?? [];

      const totalMinutes = Math.round(calls.reduce((s, c) => s + (c.duration ?? 0), 0) / 60);
      const prevMinutes = Math.round(prev.reduce((s, c) => s + (c.duration ?? 0), 0) / 60);
      const totalCalls = calls.length;
      const prevTotalCalls = prev.length;

      const overageMinutes = Math.max(0, totalMinutes - allowance);
      const baseCost = Math.min(totalMinutes, allowance) * ratePerMin;
      const overageCost = overageMinutes * overageRate;
      const totalCost = baseCost + overageCost;

      const prevTotalCost = prev.reduce((s, c) => s + (c.cost ?? 0), 0);
      const avgCostPerCall = totalCalls > 0 ? totalCost / totalCalls : 0;
      const prevAvgCost = prevTotalCalls > 0 ? prevTotalCost / prevTotalCalls : 0;

      // Usage status
      const usagePercent = allowance > 0 ? (totalMinutes / allowance) * 100 : 0;
      const usageStatus: "active" | "near_limit" | "over_limit" =
        usagePercent >= 100 ? "over_limit" : usagePercent >= 80 ? "near_limit" : "active";

      // Daily breakdown for chart
      const dailyMap: Record<string, { minutes: number; cost: number }> = {};
      calls.forEach((c) => {
        // call_timestamp might be outside but we filter by cycle
        const day = format(new Date(), "yyyy-MM-dd"); // approximate
        // We don't have call_timestamp in this select, so compute from duration/cost
      });

      // Agent breakdown
      const agentMap: Record<string, { calls: number; minutes: number; cost: number }> = {};
      calls.forEach((c) => {
        const agentId = c.agent_id ?? "unassigned";
        if (!agentMap[agentId]) agentMap[agentId] = { calls: 0, minutes: 0, cost: 0 };
        agentMap[agentId].calls += 1;
        agentMap[agentId].minutes += Math.round((c.duration ?? 0) / 60);
        agentMap[agentId].cost += c.cost ?? 0;
      });

      return {
        cycleStart: format(cycleStart, "MMM d"),
        cycleEnd: format(cycleEnd, "MMM d, yyyy"),
        daysLeft,
        usageStatus,
        totalCost: Math.round(totalCost * 100) / 100,
        totalMinutes,
        allowance,
        usagePercent: Math.round(usagePercent),
        totalCalls,
        prevTotalCalls,
        avgCostPerCall: Math.round(avgCostPerCall * 100) / 100,
        prevAvgCost: Math.round(prevAvgCost * 100) / 100,
        baseCost: Math.round(baseCost * 100) / 100,
        overageMinutes,
        overageCost: Math.round(overageCost * 100) / 100,
        ratePerMin,
        overageRate,
        billingPlan: client?.billing_plan ?? "payg",
        clientName: client?.name ?? "",
        agentBreakdown: Object.entries(agentMap).map(([id, d]) => ({
          agentId: id,
          ...d,
        })),
        callsTrend: totalCalls - prevTotalCalls,
        avgCostTrend: Math.round((avgCostPerCall - prevAvgCost) * 100) / 100,
      };
    },
  });
}

// ─── Daily usage chart data ───
export function useDailyUsageChart() {
  const { userProfile } = useAuth();
  const clientId = userProfile?.client_id;

  return useQuery({
    queryKey: ["daily-usage-chart", clientId],
    enabled: !!clientId,
    queryFn: async () => {
      const now = new Date();
      const cycleStart = startOfMonth(now);

      const { data: client } = await supabase
        .from("clients")
        .select("rate_per_minute")
        .eq("id", clientId!)
        .single();

      const ratePerMin = client?.rate_per_minute ?? 2.5;

      const { data } = await supabase
        .from("call_logs")
        .select("call_timestamp, duration")
        .eq("client_id", clientId!)
        .gte("call_timestamp", cycleStart.toISOString());

      const dailyMap: Record<string, { minutes: number; cost: number }> = {};
      (data ?? []).forEach((c) => {
        const day = format(new Date(c.call_timestamp), "yyyy-MM-dd");
        if (!dailyMap[day]) dailyMap[day] = { minutes: 0, cost: 0 };
        const mins = (c.duration ?? 0) / 60;
        dailyMap[day].minutes += mins;
        dailyMap[day].cost += mins * ratePerMin;
      });

      const days = eachDayOfInterval({ start: cycleStart, end: startOfDay(now) });
      return days.map((d) => {
        const key = format(d, "yyyy-MM-dd");
        return {
          date: format(d, "MMM d"),
          minutes: Math.round(dailyMap[key]?.minutes ?? 0),
          cost: Math.round((dailyMap[key]?.cost ?? 0) * 100) / 100,
        };
      });
    },
  });
}

// ─── Invoices ───
export function useInvoices(statusFilter?: string) {
  const { userProfile } = useAuth();
  const clientId = userProfile?.client_id;

  return useQuery({
    queryKey: ["invoices", clientId, statusFilter],
    enabled: !!clientId,
    queryFn: async () => {
      let query = supabase
        .from("invoices")
        .select("*")
        .eq("client_id", clientId!)
        .order("created_at", { ascending: false });

      if (statusFilter && statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });
}

// ─── Payment Methods ───
export function usePaymentMethods() {
  const { userProfile } = useAuth();
  const clientId = userProfile?.client_id;
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["payment-methods", clientId],
    enabled: !!clientId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_methods")
        .select("*")
        .eq("client_id", clientId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const addMethod = useMutation({
    mutationFn: async (method: {
      type: string;
      label: string;
      last_four: string;
      is_default: boolean;
    }) => {
      if (method.is_default) {
        await supabase
          .from("payment_methods")
          .update({ is_default: false })
          .eq("client_id", clientId!);
      }
      const { error } = await supabase.from("payment_methods").insert({
        client_id: clientId!,
        ...method,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payment-methods"] }),
  });

  const removeMethod = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("payment_methods").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payment-methods"] }),
  });

  const setDefault = useMutation({
    mutationFn: async (id: string) => {
      await supabase
        .from("payment_methods")
        .update({ is_default: false })
        .eq("client_id", clientId!);
      const { error } = await supabase
        .from("payment_methods")
        .update({ is_default: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payment-methods"] }),
  });

  return { ...query, addMethod, removeMethod, setDefault };
}
