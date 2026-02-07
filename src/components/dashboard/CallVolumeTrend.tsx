import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCallVolumeTrend, type DateRange } from "@/hooks/useDashboardData";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { TrendingUp, Calendar, BarChart3 } from "lucide-react";

const ranges: { label: string; value: DateRange }[] = [
  { label: "7 Days", value: "7d" },
  { label: "30 Days", value: "30d" },
  { label: "90 Days", value: "90d" },
];

export default function CallVolumeTrend() {
  const [range, setRange] = useState<DateRange>("7d");
  const { data, isLoading } = useCallVolumeTrend(range);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold">Call Activity</CardTitle>
        <div className="flex gap-1">
          {ranges.map((r) => (
            <Button
              key={r.value}
              size="sm"
              variant={range === r.value ? "default" : "ghost"}
              onClick={() => setRange(r.value)}
              className="h-7 text-xs"
            >
              {r.label}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[260px] w-full rounded-lg" />
        ) : (
          <>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={data?.chartData ?? []}>
                <defs>
                  <linearGradient id="callGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(174,62%,38%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(174,62%,38%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="label" className="text-xs" tick={{ fill: "hsl(200,10%,45%)", fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fill: "hsl(200,10%,45%)", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(210,18%,10%)",
                    border: "none",
                    borderRadius: 8,
                    color: "#fff",
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="calls"
                  stroke="hsl(174,62%,38%)"
                  strokeWidth={2}
                  fill="url(#callGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>

            <div className="mt-4 grid grid-cols-3 gap-4 text-center">
              <Stat icon={TrendingUp} label="Peak Day" value={data?.peakDay?.label ?? "–"} sub={`${data?.peakDay?.calls ?? 0} calls`} />
              <Stat icon={BarChart3} label="Avg / Day" value={String(data?.avgPerDay ?? 0)} sub="calls" />
              <Stat icon={Calendar} label="Total" value={String(data?.totalCalls ?? 0)} sub="calls in period" />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function Stat({ icon: Icon, label, value, sub }: { icon: React.ElementType; label: string; value: string; sub: string }) {
  return (
    <div className="rounded-lg bg-muted/50 p-3">
      <Icon className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}
