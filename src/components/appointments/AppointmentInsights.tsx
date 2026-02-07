import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { useAppointmentStats } from "@/hooks/useAppointments";
import { BarChart3, ChevronDown, TrendingUp, TrendingDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, BarChart, Bar,
} from "recharts";

const PIE_COLORS = [
  "hsl(210, 80%, 55%)",   // scheduled/blue
  "hsl(152, 60%, 42%)",   // confirmed/green
  "hsl(0, 72%, 51%)",     // cancelled/red
  "hsl(200, 10%, 45%)",   // no-show/muted
];

export default function AppointmentInsights() {
  const { data: stats, isLoading } = useAppointmentStats();
  const [open, setOpen] = useState(true);

  if (isLoading) {
    return <Skeleton className="h-[300px] rounded-lg" />;
  }

  if (!stats) return null;

  const trendPct =
    stats.prevTotal > 0
      ? Math.round(((stats.total - stats.prevTotal) / stats.prevTotal) * 100)
      : null;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card>
        <CardHeader className="pb-2">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                Appointment Insights
              </CardTitle>
              <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
            </Button>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="space-y-5">
            {/* Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <MetricCard
                label="Total Appointments"
                value={stats.total}
                trend={trendPct}
              />
              <MetricCard
                label="Show-up Rate"
                value={`${stats.showUpRate}%`}
                sub={`${stats.noShows} no-shows`}
              />
              <MetricCard
                label="This Week"
                value={stats.thisWeek}
              />
              <MetricCard
                label="Avg Lead Time"
                value={`${stats.avgLeadTime}d`}
                sub="booking to appointment"
              />
            </div>

            {/* Charts row */}
            <div className="grid lg:grid-cols-3 gap-4">
              {/* Appointments Over Time */}
              {stats.dailyTrend.length > 0 && (
                <div className="lg:col-span-2 rounded-lg border border-border p-3">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Appointments Over Time</p>
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={stats.dailyTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="label" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                      <Tooltip contentStyle={{ fontSize: 12 }} />
                      <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Status Distribution */}
              {stats.statusDist.length > 0 && (
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Status Distribution</p>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={stats.statusDist}
                        cx="50%" cy="50%"
                        innerRadius={40} outerRadius={65}
                        dataKey="value" nameKey="name"
                        paddingAngle={2}
                      >
                        {stats.statusDist.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap gap-2 justify-center mt-1">
                    {stats.statusDist.map((d, i) => (
                      <div key={d.name} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                        {d.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Popular Booking Times */}
            {stats.hourDist.length > 0 && (
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs font-medium text-muted-foreground mb-2">Popular Booking Times</p>
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart data={stats.hourDist}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="hour" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

function MetricCard({ label, value, trend, sub }: { label: string; value: string | number; trend?: number | null; sub?: string }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="flex items-end gap-1.5 mt-1">
        <p className="text-xl font-semibold text-foreground">{value}</p>
        {trend != null && (
          <span className={cn("flex items-center gap-0.5 text-xs font-medium mb-0.5", trend >= 0 ? "text-green-600" : "text-destructive")}>
            {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}
