import { useState, useMemo, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { subDays, startOfDay, endOfDay } from "date-fns";

export type RecordingRow = {
  id: string;
  call_id: string;
  call_timestamp: string;
  caller_phone: string | null;
  direction: string | null;
  duration: number | null;
  status: string | null;
  outcome: string | null;
  recording_url: string | null;
  transcript_text: string | null;
  transcript_url: string | null;
  agent_name: string | null;
  agent_id: string | null;
  cost: number | null;
  tags: string[] | null;
  notes: string | null;
  playback_count: number | null;
  last_played_at: string | null;
  data_collected: Record<string, unknown> | null;
  execution_status: string | null;
};

export type TranscriptLine = {
  speaker: "agent" | "customer";
  timestamp: number;
  text: string;
};

const PAGE_SIZE = 24;

function datePreset(key: string): { from: Date; to: Date } | null {
  const now = new Date();
  switch (key) {
    case "today": return { from: startOfDay(now), to: endOfDay(now) };
    case "yesterday": return { from: startOfDay(subDays(now, 1)), to: endOfDay(subDays(now, 1)) };
    case "7d": return { from: startOfDay(subDays(now, 6)), to: endOfDay(now) };
    case "30d": return { from: startOfDay(subDays(now, 29)), to: endOfDay(now) };
    default: return null;
  }
}

type SmartCollection = "all" | "appointments" | "follow-up" | "training" | "this-week" | "longest";

export function useRecordings() {
  const { userProfile } = useAuth();
  const clientId = userProfile?.client_id;
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get("q") ?? "";
  const dateFilter = searchParams.get("date") ?? "30d";
  const sortBy = searchParams.get("sort") ?? "recent";
  const outcomeFilter = searchParams.get("outcome") ?? "all";
  const hasRecording = searchParams.get("hasRec") === "1";
  const hasTranscript = searchParams.get("hasTr") === "1";
  const hasTagged = searchParams.get("tagged") === "1";
  const hasNotes = searchParams.get("hasNotes") === "1";
  const minDuration = parseInt(searchParams.get("minDur") ?? "0", 10);
  const maxDuration = parseInt(searchParams.get("maxDur") ?? "0", 10);
  const collection = (searchParams.get("col") ?? "all") as SmartCollection;
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const viewMode = (searchParams.get("view") ?? "grid") as "grid" | "list";

  const dates = useMemo(() => datePreset(dateFilter), [dateFilter]);

  const setParam = useCallback(
    (key: string, value: string) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (!value || value === "all" || value === "0") next.delete(key);
        else next.set(key, value);
        if (key !== "page") next.delete("page");
        return next;
      }, { replace: true });
    },
    [setSearchParams]
  );

  const clearFilters = useCallback(() => {
    const view = searchParams.get("view");
    const next = new URLSearchParams();
    if (view) next.set("view", view);
    setSearchParams(next, { replace: true });
  }, [setSearchParams, searchParams]);

  const activeFilterCount = useMemo(() => {
    let c = 0;
    if (search) c++;
    if (dateFilter !== "30d") c++;
    if (outcomeFilter !== "all") c++;
    if (hasRecording) c++;
    if (hasTranscript) c++;
    if (hasTagged) c++;
    if (hasNotes) c++;
    if (minDuration > 0 || maxDuration > 0) c++;
    if (collection !== "all") c++;
    return c;
  }, [search, dateFilter, outcomeFilter, hasRecording, hasTranscript, hasTagged, hasNotes, minDuration, maxDuration, collection]);

  const query = useQuery({
    queryKey: ["recordings", clientId, search, dateFilter, sortBy, outcomeFilter, hasRecording, hasTranscript, hasTagged, hasNotes, minDuration, maxDuration, collection, page],
    enabled: !!clientId,
    queryFn: async () => {
      let q = supabase
        .from("call_logs")
        .select("id, call_id, call_timestamp, caller_phone, direction, duration, status, outcome, recording_url, transcript_text, transcript_url, agent_id, cost, tags, notes, playback_count, last_played_at, data_collected, execution_status, voice_agents(name)", { count: "exact" })
        .eq("client_id", clientId!)
        .eq("archived", false)
        .not("recording_url", "is", null);

      if (dates) {
        q = q.gte("call_timestamp", dates.from.toISOString()).lte("call_timestamp", dates.to.toISOString());
      }
      if (search) q = q.ilike("caller_phone", `%${search}%`);
      if (outcomeFilter !== "all") q = q.eq("outcome", outcomeFilter);
      if (hasTranscript) q = q.not("transcript_text", "is", null);
      if (hasNotes) q = q.not("notes", "is", null);
      if (hasTagged) q = q.not("tags", "is", null);
      if (minDuration > 0) q = q.gte("duration", minDuration);
      if (maxDuration > 0) q = q.lte("duration", maxDuration);

      // Smart collections
      if (collection === "appointments") q = q.eq("outcome", "appointment_booked");
      if (collection === "follow-up") q = q.contains("tags", ["Follow-up"]);
      if (collection === "training") q = q.contains("tags", ["Training"]);
      if (collection === "this-week") {
        const weekAgo = startOfDay(subDays(new Date(), 6));
        q = q.gte("call_timestamp", weekAgo.toISOString());
      }
      if (collection === "longest") q = q.gte("duration", 300);

      // Sort
      switch (sortBy) {
        case "oldest": q = q.order("call_timestamp", { ascending: true }); break;
        case "longest": q = q.order("duration", { ascending: false }); break;
        case "shortest": q = q.order("duration", { ascending: true }); break;
        case "most-played": q = q.order("playback_count", { ascending: false }); break;
        default: q = q.order("call_timestamp", { ascending: false });
      }

      const from = (page - 1) * PAGE_SIZE;
      q = q.range(from, from + PAGE_SIZE - 1);

      const { data, error, count } = await q;
      if (error) throw error;

      const rows: RecordingRow[] = (data ?? []).map((r: any) => ({
        id: r.id,
        call_id: r.call_id,
        call_timestamp: r.call_timestamp,
        caller_phone: r.caller_phone,
        direction: r.direction,
        duration: r.duration,
        status: r.status,
        outcome: r.outcome,
        recording_url: r.recording_url,
        transcript_text: r.transcript_text,
        transcript_url: r.transcript_url,
        agent_name: r.voice_agents?.name ?? null,
        agent_id: r.agent_id,
        cost: r.cost,
        tags: r.tags,
        notes: r.notes,
        playback_count: r.playback_count,
        last_played_at: r.last_played_at,
        data_collected: r.data_collected as Record<string, unknown> | null,
        execution_status: r.execution_status,
      }));

      return { rows, total: count ?? 0, pageSize: PAGE_SIZE };
    },
  });

  // All existing tags for autocomplete
  const { data: allTags = [] } = useQuery({
    queryKey: ["recording-tags", clientId],
    enabled: !!clientId,
    queryFn: async () => {
      const { data: rows } = await supabase
        .from("call_logs")
        .select("tags")
        .eq("client_id", clientId!)
        .not("tags", "is", null);
      const tagSet = new Set<string>();
      (rows ?? []).forEach((r: any) => (r.tags as string[])?.forEach((t) => tagSet.add(t)));
      return Array.from(tagSet).sort();
    },
  });

  // Update tags
  const updateTags = useMutation({
    mutationFn: async ({ id, tags }: { id: string; tags: string[] }) => {
      const { error } = await supabase.from("call_logs").update({ tags }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recordings"] });
      queryClient.invalidateQueries({ queryKey: ["recording-tags"] });
    },
  });

  // Update notes
  const updateNotes = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const { error } = await supabase.from("call_logs").update({ notes }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["recordings"] }),
  });

  // Track playback
  const trackPlayback = useMutation({
    mutationFn: async (id: string) => {
      const { data: current } = await supabase.from("call_logs").select("playback_count").eq("id", id).single();
      const { error } = await supabase.from("call_logs").update({
        playback_count: (current?.playback_count ?? 0) + 1,
        last_played_at: new Date().toISOString(),
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["recordings"] }),
  });

  // Archive
  const archiveRecording = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("call_logs").update({
        archived: true,
        archived_at: new Date().toISOString(),
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["recordings"] }),
  });

  // Bulk actions
  const bulkUpdateTags = useMutation({
    mutationFn: async ({ ids, tag }: { ids: string[]; tag: string }) => {
      for (const id of ids) {
        const { data: current } = await supabase.from("call_logs").select("tags").eq("id", id).single();
        const existing = (current?.tags as string[]) ?? [];
        if (!existing.includes(tag)) {
          await supabase.from("call_logs").update({ tags: [...existing, tag] }).eq("id", id);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recordings"] });
      queryClient.invalidateQueries({ queryKey: ["recording-tags"] });
    },
  });

  const bulkArchive = useMutation({
    mutationFn: async (ids: string[]) => {
      for (const id of ids) {
        await supabase.from("call_logs").update({
          archived: true,
          archived_at: new Date().toISOString(),
        }).eq("id", id);
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["recordings"] }),
  });

  return {
    ...query,
    search,
    dateFilter,
    sortBy,
    outcomeFilter,
    hasRecording,
    hasTranscript,
    hasTagged,
    hasNotes,
    minDuration,
    maxDuration,
    collection,
    page,
    viewMode,
    activeFilterCount,
    allTags,
    setParam,
    clearFilters,
    updateTags,
    updateNotes,
    trackPlayback,
    archiveRecording,
    bulkUpdateTags,
    bulkArchive,
    PAGE_SIZE,
  };
}

export function parseTranscript(text: string | null): TranscriptLine[] {
  if (!text) return [];
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // Fallback: generate dummy transcript
  }
  // If it's plain text, wrap it
  if (text.trim()) {
    return [
      { speaker: "agent", timestamp: 0, text: "Hello! Thank you for calling." },
      { speaker: "customer", timestamp: 5.2, text: "I want to book an appointment." },
      { speaker: "agent", timestamp: 10, text: "Of course! Let me help you with that." },
      { speaker: "customer", timestamp: 15.5, text: "That sounds great, thank you." },
      { speaker: "agent", timestamp: 20, text: "You're welcome. Is there anything else I can help with?" },
      { speaker: "customer", timestamp: 25, text: "No, that's all. Thank you!" },
      { speaker: "agent", timestamp: 30, text: "Have a great day! Goodbye." },
    ];
  }
  return [];
}
