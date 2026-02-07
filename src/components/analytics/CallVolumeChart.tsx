import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCallVolumeChart, type AnalyticsRange } from "@/hooks/useAnalyticsData";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot,
} from "recharts";

export default function CallVolumeChart({ range }: { range: AnalyticsRange }) {
  const { data, isLoading } = useCallVolumeChart(range);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Call Volume Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[300px] w-full rounded-lg" />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data?.chartData ?? []}>
              <defs>
                <linearGradient id="volTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(174,62%,38%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(174,62%,38%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="volCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(152,60%,42%)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(152,60%,42%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="label" tick={{ fill: "hsl(200,10%,45%)", fontSize: 11 }} />
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
              <Area type="monotone" dataKey="total" name="Total Calls" stroke="hsl(174,62%,38%)" strokeWidth={2} fill="url(#volTotal)" />
              <Area type="monotone" dataKey="completed" name="Completed" stroke="hsl(152,60%,42%)" strokeWidth={2} fill="url(#volCompleted)" />
              <Area type="monotone" dataKey="failed" name="Failed/Missed" stroke="hsl(0,72%,51%)" strokeWidth={1.5} strokeDasharray="5 3" fill="none" />
              {data?.peakDay && data.peakDay.total > 0 && (
                <ReferenceDot
                  x={data.peakDay.label}
                  y={data.peakDay.total}
                  r={5}
                  fill="hsl(174,62%,38%)"
                  stroke="#fff"
                  strokeWidth={2}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
