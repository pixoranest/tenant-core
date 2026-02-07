import { useState, useEffect, useCallback } from "react";
import { useCallLogs, CallLogRow } from "@/hooks/useCallLogs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Search, X, Filter, ArrowUpDown, ChevronDown, Phone, Clock } from "lucide-react";
import { format } from "date-fns";
import CallDetailsModal from "@/components/call-logs/CallDetailsModal";
import CallLogsExport from "@/components/call-logs/CallLogsExport";

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

export default function CallLogs() {
  const {
    data,
    isLoading,
    search,
    statusFilter,
    directionFilter,
    dateFilter,
    page,
    sortCol,
    sortDir,
    outcomeFilter,
    agentFilter,
    minDuration,
    maxDuration,
    hasName,
    hasEmail,
    hasNotes,
    activeFilterCount,
    availableAgents,
    setParam,
    clearFilters,
    PAGE_SIZE,
  } = useCallLogs();

  const [localSearch, setLocalSearch] = useState(search);
  const [selectedCall, setSelectedCall] = useState<CallLogRow | null>(null);
  const [advOpen, setAdvOpen] = useState(false);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => setParam("q", localSearch), 300);
    return () => clearTimeout(t);
  }, [localSearch, setParam]);

  useEffect(() => setLocalSearch(search), [search]);

  const toggleSort = useCallback(
    (col: string) => {
      if (sortCol === col) setParam("dir", sortDir === "asc" ? "desc" : "asc");
      else {
        setParam("sort", col);
        setParam("dir", "desc");
      }
    },
    [sortCol, sortDir, setParam]
  );

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;
  const totalMinutes = data ? Math.round(data.totalDuration / 60) : 0;

  const SortHeader = ({ col, children }: { col: string; children: React.ReactNode }) => (
    <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort(col)}>
      {children}
      <ArrowUpDown className={`h-3 w-3 ${sortCol === col ? "text-foreground" : "text-muted-foreground/40"}`} />
    </button>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Call Logs</h1>
        <div className="flex items-center gap-2">
          <Select value={dateFilter} onValueChange={(v) => setParam("date", v)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
          <CallLogsExport rows={data?.rows ?? []} />
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 pb-3 space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by phone number..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setParam("status", v)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="missed">Missed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="ongoing">Ongoing</SelectItem>
              </SelectContent>
            </Select>
            <Select value={directionFilter} onValueChange={(v) => setParam("direction", v)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Direction" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Direction</SelectItem>
                <SelectItem value="inbound">Inbound</SelectItem>
                <SelectItem value="outbound">Outbound</SelectItem>
              </SelectContent>
            </Select>
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-muted-foreground">
                <X className="h-3 w-3" /> Reset
              </Button>
            )}
          </div>

          {/* Advanced Filters */}
          <Collapsible open={advOpen} onOpenChange={setAdvOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
                <Filter className="h-3 w-3" />
                Advanced Filters
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                    {activeFilterCount}
                  </Badge>
                )}
                <ChevronDown className={`h-3 w-3 transition-transform ${advOpen ? "rotate-180" : ""}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {/* Agent */}
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Agent</label>
                  <Select value={agentFilter || "all"} onValueChange={(v) => setParam("agent", v === "all" ? "" : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All agents" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Agents</SelectItem>
                      {availableAgents.map((a: any) => (
                        <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Duration range */}
                <div className="sm:col-span-2">
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Duration: {minDuration}s – {maxDuration > 0 ? `${maxDuration}s` : "any"}
                  </label>
                  <Slider
                    min={0}
                    max={600}
                    step={10}
                    value={[minDuration, maxDuration || 600]}
                    onValueChange={([min, max]) => {
                      setParam("minDur", String(min));
                      setParam("maxDur", max >= 600 ? "0" : String(max));
                    }}
                    className="mt-2"
                  />
                </div>

                {/* Data captured checkboxes */}
                <div>
                  <label className="text-xs text-muted-foreground mb-2 block">Data Captured</label>
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox checked={hasName} onCheckedChange={(c) => setParam("hasName", c ? "1" : "")} />
                      Has Name
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox checked={hasEmail} onCheckedChange={(c) => setParam("hasEmail", c ? "1" : "")} />
                      Has Email
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox checked={hasNotes} onCheckedChange={(c) => setParam("hasNotes", c ? "1" : "")} />
                      Has Notes
                    </label>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <Phone className="h-3.5 w-3.5" />
          Showing {data?.rows.length ?? 0} of {data?.total ?? 0} calls
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          {totalMinutes} minutes total
        </span>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><SortHeader col="call_timestamp">Date & Time</SortHeader></TableHead>
                <TableHead><SortHeader col="caller_phone">Phone Number</SortHeader></TableHead>
                <TableHead><SortHeader col="direction">Direction</SortHeader></TableHead>
                <TableHead><SortHeader col="duration">Duration</SortHeader></TableHead>
                <TableHead><SortHeader col="status">Status</SortHeader></TableHead>
                <TableHead><SortHeader col="outcome">Outcome</SortHeader></TableHead>
                <TableHead>Agent</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                : data?.rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                        No calls found matching your filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    data?.rows.map((row) => (
                      <TableRow
                        key={row.id}
                        className="cursor-pointer"
                        onClick={() => setSelectedCall(row)}
                      >
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(row.call_timestamp), "MMM d, yyyy · h:mm a")}
                        </TableCell>
                        <TableCell className="font-mono text-sm">{row.caller_phone ?? "—"}</TableCell>
                        <TableCell className="capitalize">{row.direction ?? "—"}</TableCell>
                        <TableCell>{formatDuration(row.duration)}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={statusColor[row.status ?? ""] ?? ""}>
                            {row.status ?? "—"}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[120px] truncate">{row.outcome ?? "—"}</TableCell>
                        <TableCell>{row.agent_name ?? "—"}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); setSelectedCall(row); }}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => page > 1 && setParam("page", String(page - 1))}
                className={page <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p = i + 1;
              return (
                <PaginationItem key={p}>
                  <PaginationLink
                    isActive={page === p}
                    onClick={() => setParam("page", String(p))}
                    className="cursor-pointer"
                  >
                    {p}
                  </PaginationLink>
                </PaginationItem>
              );
            })}
            <PaginationItem>
              <PaginationNext
                onClick={() => page < totalPages && setParam("page", String(page + 1))}
                className={page >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* Details Modal */}
      <CallDetailsModal call={selectedCall} open={!!selectedCall} onOpenChange={(o) => !o && setSelectedCall(null)} />
    </div>
  );
}
