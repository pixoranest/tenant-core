import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useIntegrationStatus, useSyncLogs } from "@/hooks/useAppointments";
import { RefreshCw, Settings, History, CheckCircle, XCircle, Clock } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function SyncStatusBar() {
  const { data: integrations, isLoading } = useIntegrationStatus();
  const [showLogs, setShowLogs] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);

  if (isLoading) return <Skeleton className="h-10 rounded-lg" />;

  const google = integrations?.find((i) => i.integration_type === "google_calendar");
  const calcom = integrations?.find((i) => i.integration_type === "cal_com");

  const handleSync = async (type: string) => {
    setSyncing(type);
    // Simulated sync – in production this would call an edge function / n8n webhook
    await new Promise((r) => setTimeout(r, 2000));
    setSyncing(null);
    toast.success(`${type === "google_calendar" ? "Google Calendar" : "Cal.com"} sync completed`);
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card px-4 py-2.5">
        <IntegrationChip
          label="Google Calendar"
          integration={google}
          syncing={syncing === "google_calendar"}
          onSync={() => handleSync("google_calendar")}
        />
        <IntegrationChip
          label="Cal.com"
          integration={calcom}
          syncing={syncing === "cal_com"}
          onSync={() => handleSync("cal_com")}
        />
        <div className="ml-auto">
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={() => setShowLogs(true)}>
            <History className="h-3.5 w-3.5" /> Sync Logs
          </Button>
        </div>
      </div>

      <SyncLogsDialog open={showLogs} onOpenChange={setShowLogs} />
    </>
  );
}

function IntegrationChip({
  label,
  integration,
  syncing,
  onSync,
}: {
  label: string;
  integration: { status: string | null; last_sync: string | null } | undefined;
  syncing: boolean;
  onSync: () => void;
}) {
  const status = integration?.status ?? "not_configured";
  const lastSync = integration?.last_sync;

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="font-medium">{label}</span>
      <Badge
        variant="secondary"
        className={cn(
          "text-[10px]",
          status === "active" && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
          status === "error" && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
          status === "configured" && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
        )}
      >
        {status === "not_configured" ? "Not Connected" : status}
      </Badge>
      {lastSync && (
        <span className="text-[11px] text-muted-foreground">
          {formatDistanceToNow(new Date(lastSync), { addSuffix: true })}
        </span>
      )}
      <Button
        variant="ghost" size="icon" className="h-6 w-6"
        onClick={onSync}
        disabled={syncing || status === "not_configured"}
      >
        <RefreshCw className={cn("h-3 w-3", syncing && "animate-spin")} />
      </Button>
    </div>
  );
}

function SyncLogsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { data: logs, isLoading } = useSyncLogs();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[700px] max-h-[70vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Sync Logs</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10" />)}
          </div>
        ) : !logs?.length ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No sync logs yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Integration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Records</TableHead>
                <TableHead>Error</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-xs">{log.synced_at ? format(new Date(log.synced_at), "MMM d, h:mm a") : "–"}</TableCell>
                  <TableCell className="text-xs capitalize">{(log.integration_type ?? "").replace("_", " ")}</TableCell>
                  <TableCell>
                    {log.status === "success" ? (
                      <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-destructive" />
                    )}
                  </TableCell>
                  <TableCell className="text-xs">{log.records_synced ?? 0}</TableCell>
                  <TableCell className="text-xs text-destructive max-w-[200px] truncate">{log.error_message ?? "–"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
}
