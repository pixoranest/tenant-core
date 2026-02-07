import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import type { CallLogRow } from "@/hooks/useCallLogs";

const statusColor: Record<string, string> = {
  completed: "bg-green-500/15 text-green-700 dark:text-green-400",
  missed: "bg-orange-500/15 text-orange-700 dark:text-orange-400",
  failed: "bg-red-500/15 text-red-700 dark:text-red-400",
  ongoing: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
};

function formatDuration(seconds: number | null) {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

interface Props {
  call: CallLogRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CallDetailsModal({ call, open, onOpenChange }: Props) {
  if (!call) return null;

  const dataEntries = call.data_collected
    ? Object.entries(call.data_collected).filter(([, v]) => v !== null && v !== undefined && v !== "")
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">Call Details</DialogTitle>
          <p className="text-xs text-muted-foreground font-mono">{call.call_id}</p>
        </DialogHeader>

        <div className="space-y-4">
          {/* Overview */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Field label="Date & Time" value={format(new Date(call.call_timestamp), "MMM d, yyyy · h:mm a")} />
            <Field label="Duration" value={formatDuration(call.duration)} />
            <Field label="Direction" value={call.direction ?? "—"} />
            <div>
              <span className="text-muted-foreground text-xs">Status</span>
              <div className="mt-0.5">
                <Badge variant="secondary" className={statusColor[call.status ?? ""] ?? ""}>
                  {call.status ?? "—"}
                </Badge>
              </div>
            </div>
            <Field label="Outcome" value={call.outcome ?? "—"} />
            <Field label="Agent" value={call.agent_name ?? "Unassigned"} />
            <Field label="Caller Phone" value={call.caller_phone ?? "—"} />
          </div>

          {/* Data Collected */}
          <Separator />
          <div>
            <h4 className="text-sm font-medium mb-2">Data Collected</h4>
            {dataEntries.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data collected for this call.</p>
            ) : (
              <div className="space-y-1.5">
                {dataEntries.map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="text-muted-foreground capitalize">{key.replace(/_/g, " ")}</span>
                    <span className="text-foreground font-medium max-w-[60%] text-right truncate">
                      {String(value)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-muted-foreground text-xs">{label}</span>
      <p className="text-foreground font-medium mt-0.5">{value}</p>
    </div>
  );
}
