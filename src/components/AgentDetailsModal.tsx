import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";

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
}

export default function AgentDetailsModal({ agent, open, onOpenChange }: Props) {
  if (!agent) return null;

  const isActive = agent.is_active !== false;

  return (
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

        <div className="space-y-4 text-sm">
          <DetailRow label="Type" value={agent.type ?? "Custom"} />
          <DetailRow
            label="Omnidimension ID"
            value={agent.omnidimension_agent_id ?? "—"}
          />

          <Separator />

          <DetailBlock label="Description" value={agent.description} />
          <DetailBlock label="Greeting Message" value={agent.greeting_message} />
          <DetailBlock label="System Prompt" value={agent.system_prompt} />

          <Separator />

          <DetailRow
            label="Created"
            value={
              agent.created_at
                ? format(new Date(agent.created_at), "MMM d, yyyy HH:mm")
                : "—"
            }
          />
          <DetailRow
            label="Last Updated"
            value={
              agent.updated_at
                ? format(new Date(agent.updated_at), "MMM d, yyyy HH:mm")
                : "—"
            }
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground font-medium capitalize">{value}</span>
    </div>
  );
}

function DetailBlock({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-muted-foreground mb-1">{label}</p>
      <p className="text-foreground whitespace-pre-wrap rounded-md bg-muted/50 p-3">
        {value || "—"}
      </p>
    </div>
  );
}
