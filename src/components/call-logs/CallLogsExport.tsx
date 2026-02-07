import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";
import type { CallLogRow } from "@/hooks/useCallLogs";
import { format } from "date-fns";

function escapeCSV(val: string) {
  if (val.includes(",") || val.includes('"') || val.includes("\n")) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

function formatDuration(seconds: number | null) {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function CallLogsExport({ rows }: { rows: CallLogRow[] }) {
  const handleExport = () => {
    if (!rows.length) {
      toast.error("No data to export");
      return;
    }

    const headers = ["Date", "Time", "Phone", "Direction", "Duration", "Status", "Outcome", "Agent", "Data Collected"];
    const csvRows = rows.map((r) => [
      format(new Date(r.call_timestamp), "yyyy-MM-dd"),
      format(new Date(r.call_timestamp), "HH:mm:ss"),
      r.caller_phone ?? "",
      r.direction ?? "",
      formatDuration(r.duration),
      r.status ?? "",
      r.outcome ?? "",
      r.agent_name ?? "",
      r.data_collected ? JSON.stringify(r.data_collected) : "",
    ]);

    const csv = [headers, ...csvRows].map((row) => row.map((v) => escapeCSV(v)).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `call-logs-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported successfully");
  };

  return (
    <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
      <Download className="h-4 w-4" />
      Export CSV
    </Button>
  );
}
