import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useAutomationLogs, useIntegrationControls, useRetrySyncLog } from "@/hooks/useAutomationLogs";
import {
  Activity, AlertTriangle, ChevronDown, CheckCircle, XCircle,
  RefreshCw, Pause, Play,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function AutomationMonitoring() {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const { data: logs, isLoading: logsLoading } = useAutomationLogs();
  const { data: integrations, isLoading: intLoading, togglePause } = useIntegrationControls();
  const retryMut = useRetrySyncLog();

  const filteredLogs = (logs ?? []).filter((log) => {
    if (filter === "all") return true;
    if (filter === "errors") return log.status === "error";
    if (filter === "sync") return (log as any).action_type === "sync" || !(log as any).action_type;
    if (filter === "reminder") return (log as any).action_type === "reminder";
    return true;
  });

  const recentErrors = (logs ?? []).filter((l) => l.status === "error").slice(0, 5);
  const hasRepeatedFailures = recentErrors.length >= 3;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card>
        <CardHeader className="pb-2">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                Automation Monitoring
                {hasRepeatedFailures && (
                  <Badge variant="destructive" className="text-[10px] ml-2">
                    <AlertTriangle className="h-3 w-3 mr-1" /> Issues Detected
                  </Badge>
                )}
              </CardTitle>
              <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
            </Button>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="space-y-5">
            {/* Alert Banner */}
            {hasRepeatedFailures && (
              <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
                <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                <div>
                  <p className="font-medium text-destructive">Repeated sync failures detected</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {recentErrors.length} recent errors. Check your integration settings or retry manually.
                  </p>
                </div>
              </div>
            )}

            {/* Integration Controls */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-foreground">Safety Controls</h4>
              {intLoading ? (
                <Skeleton className="h-20" />
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {(integrations ?? []).map((int) => (
                    <div
                      key={int.id}
                      className="flex items-center justify-between rounded-lg border border-border p-3"
                    >
                      <div>
                        <p className="text-sm font-medium capitalize">
                          {int.integration_type.replace("_", " ")}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Badge
                            variant="secondary"
                            className={cn(
                              "text-[10px]",
                              (int as any).paused
                                ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                                : int.status === "active"
                                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                  : ""
                            )}
                          >
                            {(int as any).paused ? "Paused" : int.status ?? "configured"}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground">
                          {(int as any).paused ? "Paused" : "Active"}
                        </span>
                        <Switch
                          checked={!(int as any).paused}
                          onCheckedChange={(checked) =>
                            togglePause.mutate({ integrationId: int.id, paused: !checked })
                          }
                        />
                      </div>
                    </div>
                  ))}
                  {(integrations ?? []).length === 0 && (
                    <p className="text-sm text-muted-foreground col-span-2">No integrations configured.</p>
                  )}
                </div>
              )}
            </div>

            {/* Automation Logs */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-foreground">Automation Logs</h4>
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="w-[130px] h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Events</SelectItem>
                    <SelectItem value="sync">Sync Only</SelectItem>
                    <SelectItem value="reminder">Reminders</SelectItem>
                    <SelectItem value="errors">Errors Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {logsLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10" />)}
                </div>
              ) : filteredLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">No automation logs yet.</p>
              ) : (
                <div className="rounded-lg border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Integration</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Records</TableHead>
                        <TableHead>Error</TableHead>
                        <TableHead className="w-12" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-xs">
                            {log.synced_at ? format(new Date(log.synced_at), "MMM d, h:mm a") : "–"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px] capitalize">
                              {((log as any).action_type ?? "sync").replace("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs capitalize">
                            {(log.integration_type ?? "").replace("_", " ")}
                          </TableCell>
                          <TableCell>
                            {log.status === "success" ? (
                              <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                            ) : (
                              <XCircle className="h-3.5 w-3.5 text-destructive" />
                            )}
                          </TableCell>
                          <TableCell className="text-xs">{log.records_synced ?? 0}</TableCell>
                          <TableCell className="text-xs text-destructive max-w-[180px] truncate">
                            {log.error_message ?? "–"}
                          </TableCell>
                          <TableCell>
                            {log.status === "error" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                disabled={retryMut.isPending}
                                onClick={() => retryMut.mutate(log.id)}
                              >
                                <RefreshCw className={cn("h-3 w-3", retryMut.isPending && "animate-spin")} />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
