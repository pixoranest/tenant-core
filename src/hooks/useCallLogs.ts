import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { subDays, startOfDay, endOfDay, format } from "date-fns";

export type CallLogRow = {
  id: string;
  call_id: string;
  call_timestamp: string;
  caller_phone: string | null;
  direction: string | null;
  duration: number | null;
  status: string | null;
  outcome: string | null;
  data_collected: Record<string, unknown> | null;
  agent_name: string | null;
  agent_id: string | null;
};

const PAGE_SIZE = 50;

function datePreset(key: string): { from: Date; to: Date } | null {
  const now = new Date();
  switch (key) {
    case "today":
      return { from: startOfDay(now), to: endOfDay(now) };
    case "yesterday":
      return { from: startOfDay(subDays(now, 1)), to: endOfDay(subDays(now, 1)) };
    case "7d":
      return { from: startOfDay(subDays(now, 6)), to: endOfDay(now) };
    case "30d":
      return { from: startOfDay(subDays(now, 29)), to: endOfDay(now) };
    default:
      return null;
  }
}

export function useCallLogs() {
  const { userProfile } = useAuth();
  const clientId = userProfile?.client_id;
  const [searchParams, setSearchParams] = useSearchParams();

  // Read filters from URL
  const search = searchParams.get("q") ?? "";
  const statusFilter = searchParams.get("status") ?? "all";
  const directionFilter = searchParams.get("direction") ?? "all";
  const dateFilter = searchParams.get("date") ?? "30d";
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const sortCol = searchParams.get("sort") ?? "call_timestamp";
  const sortDir = (searchParams.get("dir") ?? "desc") as "asc" | "desc";
  const outcomeFilter = searchParams.getAll("outcome");
  const agentFilter = searchParams.get("agent") ?? "";
  const minDuration = parseInt(searchParams.get("minDur") ?? "0", 10);
  const maxDuration = parseInt(searchParams.get("maxDur") ?? "0", 10);
  const hasName = searchParams.get("hasName") === "1";
  const hasEmail = searchParams.get("hasEmail") === "1";
  const hasNotes = searchParams.get("hasNotes") === "1";

  const setParam = useCallback(
    (key: string, value: string | string[]) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (key === "outcome") {
          next.delete("outcome");
          (Array.isArray(value) ? value : [value]).forEach((v) => next.append("outcome", v));
        } else {
          if (!value || value === "all" || value === "0") next.delete(key);
          else next.set(key, Array.isArray(value) ? value[0] : value);
        }
        if (key !== "page") next.delete("page");
        return next;
      }, { replace: true });
    },
    [setSearchParams]
  );

  const clearFilters = useCallback(() => {
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  const activeFilterCount = useMemo(() => {
    let c = 0;
    if (search) c++;
    if (statusFilter !== "all") c++;
    if (directionFilter !== "all") c++;
    if (dateFilter !== "30d") c++;
    if (outcomeFilter.length) c++;
    if (agentFilter) c++;
    if (minDuration > 0 || maxDuration > 0) c++;
    if (hasName || hasEmail || hasNotes) c++;
    return c;
  }, [search, statusFilter, directionFilter, dateFilter, outcomeFilter, agentFilter, minDuration, maxDuration, hasName, hasEmail, hasNotes]);

  const dates = useMemo(() => datePreset(dateFilter), [dateFilter]);

  const query = useQuery({
    queryKey: [
      "call-logs",
      clientId,
      search,
      statusFilter,
      directionFilter,
      dateFilter,
      page,
      sortCol,
      sortDir,
      outcomeFilter.join(","),
      agentFilter,
      minDuration,
      maxDuration,
      hasName,
      hasEmail,
      hasNotes,
    ],
    enabled: !!clientId,
    queryFn: async () => {
      let q = supabase
        .from("call_logs")
        .select("id, call_id, call_timestamp, caller_phone, direction, duration, status, outcome, data_collected, agent_id, voice_agents(name)", { count: "exact" })
        .eq("client_id", clientId!);

      if (dates) {
        q = q.gte("call_timestamp", dates.from.toISOString()).lte("call_timestamp", dates.to.toISOString());
      }
      if (statusFilter !== "all") q = q.eq("status", statusFilter);
      if (directionFilter !== "all") q = q.eq("direction", directionFilter);
      if (search) q = q.ilike("caller_phone", `%${search}%`);
      if (agentFilter) q = q.eq("agent_id", agentFilter);
      if (minDuration > 0) q = q.gte("duration", minDuration);
      if (maxDuration > 0) q = q.lte("duration", maxDuration);

      const validSortCols = ["call_timestamp", "duration", "status", "direction", "outcome", "caller_phone"];
      const col = validSortCols.includes(sortCol) ? sortCol : "call_timestamp";
      q = q.order(col, { ascending: sortDir === "asc" });

      const from = (page - 1) * PAGE_SIZE;
      q = q.range(from, from + PAGE_SIZE - 1);

      const { data, error, count } = await q;
      if (error) throw error;

      let rows: CallLogRow[] = (data ?? []).map((r: any) => ({
        id: r.id,
        call_id: r.call_id,
        call_timestamp: r.call_timestamp,
        caller_phone: r.caller_phone,
        direction: r.direction,
        duration: r.duration,
        status: r.status,
        outcome: r.outcome,
        data_collected: r.data_collected as Record<string, unknown> | null,
        agent_name: r.voice_agents?.name ?? null,
        agent_id: r.agent_id,
      }));

      // Client-side filters for JSONB fields
      if (outcomeFilter.length) {
        // outcome is already a column, filter was done above if single; for multi:
        rows = rows.filter((r) => outcomeFilter.includes(r.outcome ?? ""));
      }
      if (hasName) rows = rows.filter((r) => r.data_collected && (r.data_collected as any).name);
      if (hasEmail) rows = rows.filter((r) => r.data_collected && (r.data_collected as any).email);
      if (hasNotes) rows = rows.filter((r) => r.data_collected && (r.data_collected as any).notes);

      // Total duration of current results for summary
      const totalDuration = rows.reduce((s, r) => s + (r.duration ?? 0), 0);

      return { rows, total: count ?? 0, totalDuration, pageSize: PAGE_SIZE };
    },
  });

  // Available agents for filter
  const { data: availableAgents = [] } = useQuery({
    queryKey: ["call-log-agents", clientId],
    enabled: !!clientId,
    queryFn: async () => {
      const { data } = await supabase
        .from("client_agent_assignments")
        .select("agent_id, voice_agents(id, name)")
        .eq("client_id", clientId!);
      return (data ?? []).map((r: any) => ({ id: r.voice_agents?.id, name: r.voice_agents?.name })).filter((a: any) => a.id);
    },
  });

  return {
    ...query,
    search,
    statusFilter,
    directionFilter,
    dateFilter,
    page,
    sortCol,
    sortDir,
    outcomeFilter,
    agentFilter,
    minDuration,
    maxDuration,
    hasName,
    hasEmail,
    hasNotes,
    activeFilterCount,
    availableAgents,
    setParam,
    clearFilters,
    PAGE_SIZE,
  };
}
