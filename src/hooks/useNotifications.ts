import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Notification {
  id: string;
  client_id: string;
  type: string;
  title: string;
  message: string | null;
  is_read: boolean;
  link: string | null;
  created_at: string;
}

export function useUnreadCount() {
  const { userProfile } = useAuth();
  const clientId = userProfile?.client_id;

  return useQuery({
    queryKey: ["notifications-unread-count", clientId],
    enabled: !!clientId,
    refetchInterval: 30_000,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("client_id", clientId!)
        .eq("is_read", false);
      if (error) throw error;
      return count ?? 0;
    },
  });
}

export function useRecentNotifications() {
  const { userProfile } = useAuth();
  const clientId = userProfile?.client_id;

  return useQuery({
    queryKey: ["notifications-recent", clientId],
    enabled: !!clientId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("client_id", clientId!)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return (data ?? []) as Notification[];
    },
  });
}

export function useNotificationsList(filter: string, page: number) {
  const { userProfile } = useAuth();
  const clientId = userProfile?.client_id;
  const pageSize = 20;

  return useQuery({
    queryKey: ["notifications-list", clientId, filter, page],
    enabled: !!clientId,
    queryFn: async () => {
      let query = supabase
        .from("notifications")
        .select("*", { count: "exact" })
        .eq("client_id", clientId!)
        .order("created_at", { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (filter === "unread") query = query.eq("is_read", false);
      else if (filter !== "all") query = query.eq("type", filter);

      const { data, error, count } = await query;
      if (error) throw error;
      return { items: (data ?? []) as Notification[], total: count ?? 0, pageSize };
    },
  });
}

export function useNotificationMutations() {
  const qc = useQueryClient();

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications-unread-count"] });
      qc.invalidateQueries({ queryKey: ["notifications-recent"] });
      qc.invalidateQueries({ queryKey: ["notifications-list"] });
    },
  });

  const markAllRead = useMutation({
    mutationFn: async (clientId: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("client_id", clientId)
        .eq("is_read", false);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications-unread-count"] });
      qc.invalidateQueries({ queryKey: ["notifications-recent"] });
      qc.invalidateQueries({ queryKey: ["notifications-list"] });
    },
  });

  const deleteAll = useMutation({
    mutationFn: async (clientId: string) => {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("client_id", clientId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications-unread-count"] });
      qc.invalidateQueries({ queryKey: ["notifications-recent"] });
      qc.invalidateQueries({ queryKey: ["notifications-list"] });
    },
  });

  return { markRead, markAllRead, deleteAll };
}
