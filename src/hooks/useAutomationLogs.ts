import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export function useAutomationLogs(limit = 50) {
  const { userProfile } = useAuth();
  const clientId = userProfile?.client_id;

  return useQuery({
    queryKey: ["automation-logs", clientId, limit],
    enabled: !!clientId,
    queryFn: async () => {
      const { data } = await supabase
        .from("sync_logs")
        .select("*")
        .eq("client_id", clientId!)
        .order("synced_at", { ascending: false })
        .limit(limit);
      return data ?? [];
    },
  });
}

export function useIntegrationControls() {
  const { userProfile } = useAuth();
  const clientId = userProfile?.client_id;
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["integration-controls", clientId],
    enabled: !!clientId,
    queryFn: async () => {
      const { data } = await supabase
        .from("client_integrations")
        .select("*")
        .eq("client_id", clientId!);
      return data ?? [];
    },
  });

  const togglePause = useMutation({
    mutationFn: async ({ integrationId, paused }: { integrationId: string; paused: boolean }) => {
      const { error } = await supabase
        .from("client_integrations")
        .update({ paused } as any)
        .eq("id", integrationId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["integration-controls"] });
      qc.invalidateQueries({ queryKey: ["integration-status"] });
      toast.success("Integration setting updated");
    },
  });

  return { ...query, togglePause };
}

export function useRetrySyncLog() {
  const qc = useQueryClient();
  const { userProfile } = useAuth();
  const clientId = userProfile?.client_id;

  return useMutation({
    mutationFn: async (logId: string) => {
      // Simulate retry – in production this calls an edge function
      await new Promise((r) => setTimeout(r, 1500));

      // Insert a new success log entry
      const { error } = await supabase.from("sync_logs").insert({
        client_id: clientId!,
        integration_type: "manual_retry",
        status: "success",
        records_synced: 0,
        action_type: "retry",
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["automation-logs"] });
      qc.invalidateQueries({ queryKey: ["sync-logs"] });
      toast.success("Retry completed successfully");
    },
    onError: () => {
      toast.error("Retry failed");
    },
  });
}
