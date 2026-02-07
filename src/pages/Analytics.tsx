import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Download } from "lucide-react";
import { type AnalyticsRange } from "@/hooks/useAnalyticsData";
import { useAnalyticsRealtime } from "@/hooks/useAnalyticsRealtime";
import AnalyticsTopMetrics from "@/components/analytics/AnalyticsTopMetrics";
import CallVolumeChart from "@/components/analytics/CallVolumeChart";
import PerformanceCharts from "@/components/analytics/PerformanceCharts";
import CallPatternAnalysis from "@/components/analytics/CallPatternAnalysis";
import OutcomeAnalysis from "@/components/analytics/OutcomeAnalysis";
import ExportReportModal from "@/components/analytics/ExportReportModal";

const rangeOptions: { label: string; value: AnalyticsRange }[] = [
  { label: "Last 7 Days", value: "7d" },
  { label: "Last 30 Days", value: "30d" },
  { label: "Last 90 Days", value: "90d" },
  { label: "This Month", value: "this_month" },
  { label: "Last Month", value: "last_month" },
];

export default function Analytics() {
  const [range, setRange] = useState<AnalyticsRange>("30d");
  const [compare, setCompare] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  useAnalyticsRealtime();

  const rangeLabel = rangeOptions.find((r) => r.value === range)?.label ?? range;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Analytics & Reports</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Comprehensive insights into your call performance</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Select value={range} onValueChange={(v) => setRange(v as AnalyticsRange)}>
            <SelectTrigger className="w-[170px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {rangeOptions.map((r) => (
                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <Switch checked={compare} onCheckedChange={setCompare} />
            Compare
          </label>

          <Button variant="outline" size="sm" className="gap-2" onClick={() => setExportOpen(true)}>
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Top Metrics */}
      <AnalyticsTopMetrics range={range} compare={compare} />

      {/* Call Volume */}
      <CallVolumeChart range={range} />

      {/* Performance */}
      <PerformanceCharts range={range} />

      {/* Call Patterns */}
      <CallPatternAnalysis range={range} />

      {/* Outcomes & Business Impact */}
      <OutcomeAnalysis range={range} />

      {/* Export Modal */}
      <ExportReportModal open={exportOpen} onClose={() => setExportOpen(false)} rangeLabel={rangeLabel} />
    </div>
  );
}
