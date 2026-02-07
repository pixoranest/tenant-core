import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PhoneCall, Clock, CheckCircle, Timer, ArrowUp, ArrowDown } from "lucide-react";
import { useAnalyticsTopMetrics, type AnalyticsRange } from "@/hooks/useAnalyticsData";
import { AreaChart, Area, ResponsiveContainer } from "recharts";

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const chartData = data.map((v, i) => ({ i, v }));
  return (
    <ResponsiveContainer width="100%" height={32}>
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id={`spark-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#spark-${color})`} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function TrendBadge({ value }: { value: number | null }) {
  if (value === null) return <span className="text-xs text-white/50">No prior data</span>;
  const up = value >= 0;
  return (
    <span className={`flex items-center gap-0.5 text-xs ${up ? "text-emerald-200" : "text-red-200"}`}>
      {up ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
      {Math.abs(value)}% vs previous
    </span>
  );
}

export default function AnalyticsTopMetrics({ range, compare }: { range: AnalyticsRange; compare: boolean }) {
  const { data, isLoading } = useAnalyticsTopMetrics(range, compare);

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
      </div>
    );
  }

  const cards = [
    {
      title: "Total Calls",
      value: (data?.totalCalls ?? 0).toLocaleString(),
      icon: PhoneCall,
      gradient: "from-[hsl(210,80%,55%)] to-[hsl(210,80%,40%)]",
      trend: data?.trends.calls ?? null,
      sparkData: data?.sparkCalls ?? [],
      sparkColor: "#93c5fd",
    },
    {
      title: "Total Minutes",
      value: (data?.totalMinutes ?? 0).toLocaleString(),
      icon: Clock,
      gradient: "from-[hsl(270,55%,55%)] to-[hsl(270,55%,42%)]",
      trend: data?.trends.minutes ?? null,
      sparkData: data?.sparkMinutes ?? [],
      sparkColor: "#c4b5fd",
    },
    {
      title: "Success Rate",
      value: `${data?.successRate ?? 0}%`,
      icon: CheckCircle,
      gradient: "from-[hsl(152,60%,42%)] to-[hsl(152,60%,32%)]",
      trend: data?.trends.success ?? null,
      sparkData: data?.sparkSuccess ?? [],
      sparkColor: "#86efac",
    },
    {
      title: "Avg Call Duration",
      value: formatDuration(data?.avgDuration ?? 0),
      icon: Timer,
      gradient: "from-[hsl(174,62%,38%)] to-[hsl(174,62%,28%)]",
      trend: data?.trends.duration ?? null,
      sparkData: data?.sparkDuration ?? [],
      sparkColor: "#5eead4",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <div
          key={c.title}
          className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${c.gradient} p-5 text-white shadow-lg transition-transform hover:scale-[1.02]`}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-white/80">{c.title}</p>
            <c.icon className="h-5 w-5 text-white/60" />
          </div>
          <p className="mt-2 text-3xl font-bold">{c.value}</p>
          <div className="mt-1">
            <TrendBadge value={c.trend} />
          </div>
          <div className="mt-2">
            <MiniSparkline data={c.sparkData} color={c.sparkColor} />
          </div>
        </div>
      ))}
    </div>
  );
}
