import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Bot,
  Phone,
  Trash2,
  Pencil,
  Check,
  X,
  Loader2,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";
import AssignAgentModal from "./AssignAgentModal";

type Assignment = {
  id: string;
  agent_id: string;
  phone_number: string | null;
  status: string | null;
  assigned_at: string | null;
  agent_name: string;
  agent_type: string | null;
};

const TYPE_COLORS: Record<string, string> = {
  dental: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  sales: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  "real estate": "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  support: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  healthcare: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  education: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
  custom: "bg-muted text-muted-foreground",
};

function getTypeBadgeClass(type: string | null) {
  return TYPE_COLORS[(type ?? "custom").toLowerCase()] ?? TYPE_COLORS.custom;
}

interface Props {
  clientId: string;
}

export default function AssignedAgentsList({ clientId }: Props) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [assignOpen, setAssignOpen] = useState(false);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPhone, setEditPhone] = useState("");

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ["client-assignments", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_agent_assignments")
        .select("id, agent_id, phone_number, status, assigned_at, voice_agents(name, type)")
        .eq("client_id", clientId)
        .order("assigned_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((row: any) => ({
        id: row.id,
        agent_id: row.agent_id,
        phone_number: row.phone_number,
        status: row.status,
        assigned_at: row.assigned_at,
        agent_name: row.voice_agents?.name ?? "Unknown",
        agent_type: row.voice_agents?.type ?? null,
      })) as Assignment[];
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("client_agent_assignments")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-assignments", clientId] });
      queryClient.invalidateQueries({ queryKey: ["agent-assignment-counts"] });
      toast({ title: "Voice agent assignment removed" });
      setRemoveId(null);
    },
    onError: () => {
      toast({ title: "Failed to remove assignment", variant: "destructive" });
    },
  });

  const updatePhoneMutation = useMutation({
    mutationFn: async ({ id, phone }: { id: string; phone: string }) => {
      const { error } = await supabase
        .from("client_agent_assignments")
        .update({ phone_number: phone })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-assignments", clientId] });
      toast({ title: "Phone number updated" });
      setEditingId(null);
    },
    onError: () => {
      toast({ title: "Failed to update phone number", variant: "destructive" });
    },
  });

  const startEdit = (a: Assignment) => {
    setEditingId(a.id);
    setEditPhone(a.phone_number ?? "");
  };

  const savePhone = (id: string) => {
    updatePhoneMutation.mutate({ id, phone: editPhone });
  };

  return (
    <>
      <Card className="lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Assigned Voice Agents</CardTitle>
          <Button size="sm" onClick={() => setAssignOpen(true)}>
            <Bot className="mr-1 h-3.5 w-3.5" /> Assign Agent
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          )}

          {!isLoading && assignments.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bot className="mb-3 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No voice agents assigned to this client yet.
              </p>
            </div>
          )}

          {!isLoading && assignments.length > 0 && (
            <div className="space-y-3">
              {assignments.map((a) => (
                <div
                  key={a.id}
                  className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex flex-col gap-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm text-foreground">{a.agent_name}</span>
                      <Badge
                        variant="secondary"
                        className={`text-xs capitalize ${getTypeBadgeClass(a.agent_type)}`}
                      >
                        {a.agent_type ?? "Custom"}
                      </Badge>
                      <span
                        className={`inline-flex h-2 w-2 rounded-full ${
                          a.status === "active" ? "bg-emerald-500" : "bg-muted-foreground"
                        }`}
                        title={a.status === "active" ? "Active" : "Inactive"}
                      />
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {editingId === a.id ? (
                          <span className="flex items-center gap-1">
                            <Input
                              value={editPhone}
                              onChange={(e) => setEditPhone(e.target.value)}
                              className="h-6 w-36 text-xs"
                              autoFocus
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5"
                              onClick={() => savePhone(a.id)}
                              disabled={updatePhoneMutation.isPending}
                            >
                              {updatePhoneMutation.isPending ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Check className="h-3 w-3" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5"
                              onClick={() => setEditingId(null)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </span>
                        ) : (
                          a.phone_number ?? "No number"
                        )}
                      </span>
                      {a.assigned_at && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(a.assigned_at), "MMM d, yyyy")}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-1 shrink-0">
                    {editingId !== a.id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        title="Edit phone number"
                        onClick={() => startEdit(a)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      title="Remove assignment"
                      onClick={() => setRemoveId(a.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AssignAgentModal open={assignOpen} onOpenChange={setAssignOpen} clientId={clientId} />

      <AlertDialog open={!!removeId} onOpenChange={(o) => !o && setRemoveId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Assignment</AlertDialogTitle>
            <AlertDialogDescription>
              Remove this voice agent from the client? This won't delete the agent itself.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => removeId && removeMutation.mutate(removeId)}
              disabled={removeMutation.isPending}
            >
              {removeMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
