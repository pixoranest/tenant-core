import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Pencil, Trash2, Loader2, ExternalLink, Phone, Calendar, Bot } from "lucide-react";

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

interface Props {
  agent: VoiceAgent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (agent: VoiceAgent) => void;
}

type ClientAssignment = {
  id: string;
  client_id: string;
  client_name: string;
  phone_number: string | null;
  status: string | null;
  assigned_at: string | null;
};

export default function AgentDetailsModal({ agent, open, onOpenChange, onEdit }: Props) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);

  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery({
    queryKey: ["agent-detail-assignments", agent?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_agent_assignments")
        .select("id, client_id, phone_number, status, assigned_at, clients(name)")
        .eq("agent_id", agent!.id)
        .order("assigned_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((row: any) => ({
        id: row.id,
        client_id: row.client_id,
        client_name: row.clients?.name ?? "Unknown",
        phone_number: row.phone_number,
        status: row.status,
        assigned_at: row.assigned_at,
      })) as ClientAssignment[];
    },
    enabled: open && !!agent,
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("voice_agents").delete().eq("id", agent!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-voice-agents"] });
      toast({ title: "Voice agent deleted successfully" });
      setDeleteOpen(false);
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "Failed to delete voice agent", variant: "destructive" });
    },
  });

  if (!agent) return null;

  const isActive = agent.is_active !== false;
  const hasAssignments = assignments.length > 0;

  const handleDeleteClick = () => {
    setDeleteConfirmed(false);
    if (hasAssignments) {
      toast({
        title: "Cannot delete this agent",
        description: "Remove all client assignments first.",
        variant: "destructive",
      });
      return;
    }
    setDeleteOpen(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <DialogTitle>{agent.name}</DialogTitle>
              <Badge variant={isActive ? "default" : "secondary"}>
                {isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            <DialogDescription>Agent configuration details</DialogDescription>
          </DialogHeader>

          <div className="space-y-5 text-sm">
            {/* Section 1: Agent Information */}
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Agent Information
              </h4>
              <DetailRow label="Type" value={agent.type ?? "Custom"} />
              <DetailRow label="Description" value={agent.description ?? "—"} />
              <DetailRow
                label="Created"
                value={agent.created_at ? format(new Date(agent.created_at), "MMM d, yyyy") : "—"}
              />
              <DetailRow
                label="Last Updated"
                value={agent.updated_at ? format(new Date(agent.updated_at), "MMM d, yyyy HH:mm") : "—"}
              />
            </div>

            <Separator />

            {/* Section 2: Omnidimension Configuration */}
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Omnidimension Configuration
              </h4>
              <DetailRow label="Agent ID" value={agent.omnidimension_agent_id ?? "—"} />
              <DetailBlock label="Greeting Message" value={agent.greeting_message} />
              <DetailBlock label="System Prompt" value={agent.system_prompt} />
            </div>

            <Separator />

            {/* Section 3: Assigned Clients */}
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Assigned Clients ({assignments.length})
              </h4>

              {assignmentsLoading && (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              )}

              {!assignmentsLoading && assignments.length === 0 && (
                <div className="flex flex-col items-center py-4 text-center">
                  <Bot className="mb-2 h-6 w-6 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">
                    This agent is not assigned to any clients.
                  </p>
                </div>
              )}

              {!assignmentsLoading && assignments.length > 0 && (
                <div className="space-y-2">
                  {assignments.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center justify-between rounded-md border border-border p-3"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <p className="font-medium text-foreground text-sm truncate">
                          {a.client_name}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {a.phone_number ?? "No number"}
                          </span>
                          <span
                            className={`inline-flex h-1.5 w-1.5 rounded-full ${
                              a.status === "active" ? "bg-emerald-500" : "bg-muted-foreground"
                            }`}
                          />
                          <span className="capitalize">{a.status ?? "active"}</span>
                          {a.assigned_at && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(a.assigned_at), "MMM d, yyyy")}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        title="View client"
                        onClick={() => {
                          onOpenChange(false);
                          navigate(`/admin/clients/${a.client_id}`);
                        }}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            {onEdit && (
              <Button
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                  onEdit(agent);
                }}
              >
                <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
              </Button>
            )}
            <Button variant="destructive" onClick={handleDeleteClick}>
              <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Voice Agent?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this agent configuration. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex items-center gap-2 py-2">
            <Checkbox
              id="confirm-delete"
              checked={deleteConfirmed}
              onCheckedChange={(c) => setDeleteConfirmed(c === true)}
            />
            <label htmlFor="confirm-delete" className="text-sm text-muted-foreground cursor-pointer">
              I understand this action is permanent
            </label>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={!deleteConfirmed || deleteMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                deleteMutation.mutate();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Agent
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="text-foreground font-medium text-right capitalize">{value}</span>
    </div>
  );
}

function DetailBlock({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-muted-foreground mb-1">{label}</p>
      <p className="text-foreground whitespace-pre-wrap rounded-md bg-muted/50 p-3 text-xs">
        {value || "—"}
      </p>
    </div>
  );
}
