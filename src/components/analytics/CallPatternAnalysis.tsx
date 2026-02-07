import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCallPatterns, type AnalyticsRange } from "@/hooks/useAnalyticsData";
import { Clock, CalendarDays, TrendingDown } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

export default function CallPatternAnalysis({ range }: { range: AnalyticsRange }) {
  const { data, isLoading } = useCallPatterns(range);

  if (isLoading) {
    return <Skeleton className="h-[400px] w-full rounded-xl" />;
  }

  const hourData = data?.hourCounts ?? [];
  const dayData = data?.dayCounts ?? [];
  const topHours = data?.topHours ?? [];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Call Pattern Analysis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Calls by Hour */}
          <div>
            <p className="mb-2 text-sm font-medium text-muted-foreground">Calls by Hour of Day</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={hourData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="label" tick={{ fill: "hsl(200,10%,45%)", fontSize: 10 }} interval={2} />
                <YAxis allowDecimals={false} tick={{ fill: "hsl(200,10%,45%)", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(210,18%,10%)", border: "none", borderRadius: 8, color: "#fff", fontSize: 12 }}
                  formatter={(val: number) => [val, "Calls"]}
                />
                <Bar dataKey="calls" radius={[3, 3, 0, 0]}>
                  {hourData.map((entry) => (
                    <Cell
                      key={entry.hour}
                      fill={topHours.includes(entry.hour) ? "hsl(174,62%,38%)" : "hsl(200,10%,75%)"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Calls by Day of Week */}
          <div>
            <p className="mb-2 text-sm font-medium text-muted-foreground">Calls by Day of Week</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dayData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis type="number" allowDecimals={false} tick={{ fill: "hsl(200,10%,45%)", fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fill: "hsl(200,10%,45%)", fontSize: 11 }} width={80} />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(210,18%,10%)", border: "none", borderRadius: 8, color: "#fff", fontSize: 12 }}
                  formatter={(val: number) => [val, "Calls"]}
                />
                <Bar dataKey="calls" fill="hsl(270,55%,55%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Key Insights */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-4">
            <Clock className="mt-0.5 h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium text-foreground">Peak Hour</p>
              <p className="text-lg font-bold text-foreground">{data?.peakHour?.label ?? "–"}</p>
              <p className="text-xs text-muted-foreground">{data?.peakHour?.calls ?? 0} calls</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-4">
            <CalendarDays className="mt-0.5 h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium text-foreground">Busiest Day</p>
              <p className="text-lg font-bold text-foreground">{data?.busiestDay?.name ?? "–"}</p>
              <p className="text-xs text-muted-foreground">{data?.busiestDay?.calls ?? 0} calls</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-4">
            <TrendingDown className="mt-0.5 h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">Slowest Period</p>
              <p className="text-lg font-bold text-foreground">
                {data?.slowestHours?.[0]?.label ?? "–"} – {data?.slowestHours?.[2]?.label ?? "–"}
              </p>
              <p className="text-xs text-muted-foreground">Lowest call volume</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
