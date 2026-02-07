import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  Clock,
  PhoneCall,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface BillingOverviewCardsProps {
  data: {
    totalCost: number;
    totalMinutes: number;
    allowance: number;
    usagePercent: number;
    totalCalls: number;
    prevTotalCalls: number;
    avgCostPerCall: number;
    prevAvgCost: number;
    usageStatus: "active" | "near_limit" | "over_limit";
    callsTrend: number;
    avgCostTrend: number;
  };
}

const statusColor = {
  active: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  near_limit: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20",
  over_limit: "bg-destructive/15 text-destructive border-destructive/20",
};

const chargeColor = {
  active: "text-emerald-600 dark:text-emerald-400",
  near_limit: "text-amber-600 dark:text-amber-400",
  over_limit: "text-destructive",
};

function TrendIndicator({ value, suffix = "" }: { value: number; suffix?: string }) {
  if (value === 0) return null;
  const up = value > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs ${up ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
      {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {up ? "+" : ""}
      {value}
      {suffix}
    </span>
  );
}

export default function BillingOverviewCards({ data }: BillingOverviewCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Current Charges */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <DollarSign className="h-4 w-4" />
            Current Charges
          </div>
          <p className={`mt-2 text-3xl font-bold ${chargeColor[data.usageStatus]}`}>
            ₹{data.totalCost.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Current billing cycle charges</p>
        </CardContent>
      </Card>

      {/* Minutes Used */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Clock className="h-4 w-4" />
            Minutes Used
          </div>
          <p className="mt-2 text-3xl font-bold text-foreground">
            {data.totalMinutes.toLocaleString()}
          </p>
          <Progress
            value={Math.min(data.usagePercent, 100)}
            className="mt-2 h-2"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            of {data.allowance.toLocaleString()} minutes ({data.usagePercent}%)
          </p>
        </CardContent>
      </Card>

      {/* Total Calls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <PhoneCall className="h-4 w-4" />
            Total Calls
          </div>
          <p className="mt-2 text-3xl font-bold text-foreground">{data.totalCalls}</p>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Calls this cycle</span>
            <TrendIndicator value={data.callsTrend} />
          </div>
        </CardContent>
      </Card>

      {/* Avg Cost / Call */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <DollarSign className="h-4 w-4" />
            Avg Cost / Call
          </div>
          <p className="mt-2 text-3xl font-bold text-foreground">
            ₹{data.avgCostPerCall}
          </p>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Average cost per call</span>
            <TrendIndicator value={data.avgCostTrend} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
