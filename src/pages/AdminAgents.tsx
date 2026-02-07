import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Pencil,
  ShieldOff,
  Bot,
  Stethoscope,
  TrendingUp,
  Building,
  Headphones,
  Heart,
  GraduationCap,
  Wrench,
  Users,
} from "lucide-react";
import AgentFormModal from "@/components/AgentFormModal";
import AgentDetailsModal from "@/components/AgentDetailsModal";

type VoiceAgent = {
  id: string;
  name: string;
  type: string | null;
  description: string | null;
  greeting_message: string | null;
  system_prompt: string | null;
  omnidimension_agent_id: string | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
};

const AGENT_TYPE_CONFIG: Record<string, { icon: typeof Bot; color: string }> = {
  dental: { icon: Stethoscope, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  sales: { icon: TrendingUp, color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
  "real estate": { icon: Building, color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
  support: { icon: Headphones, color: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300" },
  healthcare: { icon: Heart, color: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300" },
  education: { icon: GraduationCap, color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300" },
  custom: { icon: Wrench, color: "bg-gray-100 text-gray-700 dark:bg-gray-800/60 dark:text-gray-300" },
};

function getTypeConfig(type: string | null) {
  const key = (type ?? "custom").toLowerCase();
  return AGENT_TYPE_CONFIG[key] ?? AGENT_TYPE_CONFIG.custom;
}

export default function AdminAgents() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editAgent, setEditAgent] = useState<VoiceAgent | null>(null);
  const [detailsAgent, setDetailsAgent] = useState<VoiceAgent | null>(null);

  const { data: agents = [], isLoading } = useQuery({
    queryKey: ["admin-voice-agents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("voice_agents")
        .select("*")
        .order("is_active", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as VoiceAgent[];
    },
  });

  const { data: assignmentCounts = {} } = useQuery({
    queryKey: ["agent-assignment-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_agent_assignments")
        .select("agent_id, status");
      if (error) throw error;
      const counts: Record<string, number> = {};
      (data ?? []).forEach((a) => {
        if (a.status === "active") {
          counts[a.agent_id] = (counts[a.agent_id] ?? 0) + 1;
        }
      });
      return counts;
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: async (agentId: string) => {
      const { error } = await supabase
        .from("voice_agents")
        .update({ is_active: false })
        .eq("id", agentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-voice-agents"] });
      toast({ title: "Agent deactivated" });
    },
    onError: () => {
      toast({ title: "Failed to deactivate agent", variant: "destructive" });
    },
  });

  const sorted = useMemo(() => {
    return [...agents].sort((a, b) => {
      if (a.is_active === b.is_active) return 0;
      return a.is_active ? -1 : 1;
    });
  }, [agents]);

  const openEdit = (agent: VoiceAgent) => {
    setEditAgent(agent);
    setModalOpen(true);
  };

  const openCreate = () => {
    setEditAgent(null);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Voice Agents</h1>
        <Button size="sm" onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> Create New Agent
        </Button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-4 w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && sorted.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Bot className="mb-4 h-10 w-10 text-muted-foreground" />
            <p className="text-lg font-medium text-foreground">
              No voice agents created yet
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Create your first agent to get started!
            </p>
            <Button size="sm" className="mt-4" onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" /> Create New Agent
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Agent cards grid */}
      {!isLoading && sorted.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((agent) => {
            const typeConfig = getTypeConfig(agent.type);
            const TypeIcon = typeConfig.icon;
            const clientCount = assignmentCounts[agent.id] ?? 0;
            const isActive = agent.is_active !== false;

            return (
              <Card
                key={agent.id}
                className={`group cursor-pointer transition-shadow hover:shadow-md ${
                  !isActive ? "opacity-60" : ""
                }`}
                onClick={() => setDetailsAgent(agent)}
              >
                <CardContent className="p-5 space-y-3">
                  {/* Top row: icon + name + status */}
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${typeConfig.color}`}
                    >
                      <TypeIcon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="truncate text-sm font-semibold text-foreground">
                          {agent.name}
                        </h3>
                        <span
                          className={`inline-flex h-2 w-2 shrink-0 rounded-full ${
                            isActive ? "bg-emerald-500" : "bg-muted-foreground"
                          }`}
                          title={isActive ? "Active" : "Inactive"}
                        />
                      </div>
                      <Badge variant="secondary" className="mt-1 text-xs capitalize">
                        {agent.type ?? "Custom"}
                      </Badge>
                    </div>
                  </div>

                  {/* Description */}
                  {agent.description && (
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {agent.description}
                    </p>
                  )}

                  {/* Footer: usage + actions */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3.5 w-3.5" />
                      Used by {clientCount} client{clientCount !== 1 ? "s" : ""}
                    </span>
                    <div
                      className="flex gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        title="Edit"
                        onClick={() => openEdit(agent)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      {isActive && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          title="Deactivate"
                          onClick={() => deactivateMutation.mutate(agent.id)}
                        >
                          <ShieldOff className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <AgentFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        editAgent={editAgent}
      />

      <AgentDetailsModal
        agent={detailsAgent}
        open={!!detailsAgent}
        onOpenChange={(open) => {
          if (!open) setDetailsAgent(null);
        }}
      />
    </div>
  );
}
