import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useRecentCalls } from "@/hooks/useDashboardData";
import { Phone, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Tables } from "@/integrations/supabase/types";

const statusColors: Record<string, string> = {
  completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  missed: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  failed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  ongoing: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
};

function formatDuration(seconds: number | null) {
  if (!seconds) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatPhone(phone: string | null) {
  if (!phone) return "Unknown";
  return phone;
}

export default function RecentCalls() {
  const { data: calls, isLoading } = useRecentCalls();
  const [selected, setSelected] = useState<Tables<"call_logs"> | null>(null);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-semibold">Recent Calls</CardTitle>
          <Link
            to="/dashboard/call-logs"
            className="text-sm font-medium text-primary hover:underline"
          >
            View All
          </Link>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-lg" />
              ))}
            </div>
          ) : !calls?.length ? (
            <div className="flex flex-col items-center py-10 text-center">
              <Phone className="mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                No calls yet. Call activity will appear here.
              </p>
            </div>
          ) : (
            <ul className="space-y-1">
              {calls.map((call) => (
                <li
                  key={call.id}
                  onClick={() => setSelected(call)}
                  className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/60"
                >
                  <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {formatPhone(call.caller_phone)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(call.call_timestamp), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatDuration(call.duration)}
                  </div>
                  <Badge
                    variant="secondary"
                    className={statusColors[call.status ?? ""] ?? ""}
                  >
                    {call.status ?? "unknown"}
                  </Badge>
                  {call.outcome && (
                    <Badge variant="outline" className="text-xs hidden sm:inline-flex">
                      {call.outcome.replace(/_/g, " ")}
                    </Badge>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Placeholder details modal */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Call Details</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <Row label="Call ID" value={selected.call_id} />
              <Row label="Phone" value={formatPhone(selected.caller_phone)} />
              <Row label="Direction" value={selected.direction ?? "–"} />
              <Row label="Duration" value={formatDuration(selected.duration)} />
              <Row label="Status" value={selected.status ?? "–"} />
              <Row label="Outcome" value={selected.outcome?.replace(/_/g, " ") ?? "–"} />
              <Row
                label="Time"
                value={new Date(selected.call_timestamp).toLocaleString()}
              />
              <p className="pt-2 text-xs text-muted-foreground italic">
                Full call details, recordings, and transcripts will be available in a future update.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-border pb-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}
