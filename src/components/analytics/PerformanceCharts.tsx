import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useStatusDistribution, useAvgDurationTrend, type AnalyticsRange } from "@/hooks/useAnalyticsData";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ReferenceLine,
} from "recharts";

const STATUS_COLORS: Record<string, string> = {
  completed: "hsl(152,60%,42%)",
  missed: "hsl(30,90%,55%)",
  failed: "hsl(0,72%,51%)",
  ongoing: "hsl(210,80%,55%)",
  unknown: "hsl(200,10%,55%)",
};

function StatusDonut({ range }: { range: AnalyticsRange }) {
  const { data, isLoading } = useStatusDistribution(range);

  if (isLoading) return <Skeleton className="h-[260px] w-full rounded-lg" />;

  const items = data?.distribution ?? [];

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={items}
            cx="50%"
            cy="50%"
            innerRadius={65}
            outerRadius={95}
            paddingAngle={2}
            dataKey="value"
            nameKey="name"
          >
            {items.map((entry) => (
              <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? STATUS_COLORS.unknown} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(210,18%,10%)",
              border: "none",
              borderRadius: 8,
              color: "#fff",
              fontSize: 12,
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center">
          <p className="text-2xl font-bold text-foreground">{data?.total ?? 0}</p>
          <p className="text-xs text-muted-foreground">Total Calls</p>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        {items.map((item) => (
          <div key={item.name} className="flex items-center gap-1.5 text-xs">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[item.name] ?? STATUS_COLORS.unknown }} />
            <span className="capitalize text-muted-foreground">{item.name}</span>
            <span className="font-medium text-foreground">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DurationTrend({ range }: { range: AnalyticsRange }) {
  const { data, isLoading } = useAvgDurationTrend(range);

  if (isLoading) return <Skeleton className="h-[260px] w-full rounded-lg" />;

  return (
    <>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data?.chartData ?? []}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="label" tick={{ fill: "hsl(200,10%,45%)", fontSize: 11 }} />
          <YAxis tick={{ fill: "hsl(200,10%,45%)", fontSize: 11 }} unit="m" />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(210,18%,10%)",
              border: "none",
              borderRadius: 8,
              color: "#fff",
              fontSize: 12,
            }}
            formatter={(val: number) => [`${val} min`, "Avg Duration"]}
          />
          <ReferenceLine
            y={data?.overallAvg ?? 0}
            stroke="hsl(174,62%,38%)"
            strokeDasharray="5 3"
            label={{ value: `Avg: ${data?.overallAvg}m`, fill: "hsl(174,62%,38%)", fontSize: 11, position: "right" }}
          />
          <Bar dataKey="avgMinutes" name="Avg Duration" fill="hsl(270,55%,55%)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </>
  );
}

export default function PerformanceCharts({ range }: { range: AnalyticsRange }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">Call Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <StatusDonut range={range} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">Average Call Duration Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <DurationTrend range={range} />
        </CardContent>
      </Card>
    </div>
  );
}
