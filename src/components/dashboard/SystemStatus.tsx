import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSystemStatus } from "@/hooks/useDashboardData";
import { Bot, FileSpreadsheet, CalendarDays, Webhook } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const integrationDefs = [
  { key: "google_sheets", label: "Google Sheets", icon: FileSpreadsheet },
  { key: "google_calendar", label: "Calendar", icon: CalendarDays },
  { key: "webhook", label: "Webhook", icon: Webhook },
];

function statusDot(status: string) {
  if (status === "configured") return "bg-green-500";
  if (status === "error") return "bg-red-500";
  return "bg-muted-foreground/40";
}

function statusLabel(status: string) {
  if (status === "configured") return "Configured";
  if (status === "error") return "Error";
  return "Not Configured";
}

export default function SystemStatus() {
  const { data, isLoading } = useSystemStatus();
  const [infoModal, setInfoModal] = useState<string | null>(null);

  if (isLoading) {
    return <Skeleton className="h-48 rounded-xl" />;
  }

  const items = [
    {
      key: "voice_agent",
      label: "Voice Agent",
      icon: Bot,
      status: data?.voiceAgent.active ? "configured" : "inactive",
      sub: data?.voiceAgent.lastCallTime
        ? `Last call ${formatDistanceToNow(new Date(data.voiceAgent.lastCallTime), { addSuffix: true })}`
        : "No calls yet",
    },
    ...integrationDefs.map((def) => ({
      key: def.key,
      label: def.label,
      icon: def.icon,
      status: data?.integrations[def.key] ?? "inactive",
      sub: statusLabel(data?.integrations[def.key] ?? "inactive"),
    })),
  ];

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {items.map((item) => (
              <button
                key={item.key}
                onClick={() => setInfoModal(item.key)}
                className="flex items-center gap-3 rounded-lg border border-border p-3 text-left transition-colors hover:bg-muted/60"
              >
                <item.icon className="h-5 w-5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground truncate">{item.sub}</p>
                </div>
                <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${statusDot(item.status)}`} />
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!infoModal} onOpenChange={() => setInfoModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {items.find((i) => i.key === infoModal)?.label ?? ""} Status
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This shows the current configuration status. Settings are managed by your administrator.
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
