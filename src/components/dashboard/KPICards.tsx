import { PhoneCall, PhoneForwarded, Clock, CheckCircle, ArrowUp, ArrowDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

interface KPIData {
  todayCalls: number;
  todayChange: number | null;
  activeCalls: number;
  totalMinutes: number;
  successRate: number;
}

export default function KPICards({ data, isLoading }: { data?: KPIData; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Total Calls Today",
      value: data?.todayCalls ?? 0,
      icon: PhoneCall,
      gradient: "from-[hsl(210,80%,55%)] to-[hsl(210,80%,40%)]",
      sub: data?.todayChange != null ? (
        <span className="flex items-center gap-1 text-xs text-white/80">
          {data.todayChange >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
          {Math.abs(data.todayChange)}% vs yesterday
        </span>
      ) : (
        <span className="text-xs text-white/60">No data yesterday</span>
      ),
    },
    {
      title: "Active Calls",
      value: data?.activeCalls ?? 0,
      icon: PhoneForwarded,
      gradient: "from-[hsl(152,60%,42%)] to-[hsl(152,60%,32%)]",
      sub: <span className="text-xs text-white/80">Calls currently ongoing</span>,
      pulse: (data?.activeCalls ?? 0) > 0,
    },
    {
      title: "Minutes This Month",
      value: (data?.totalMinutes ?? 0).toLocaleString(),
      icon: Clock,
      gradient: "from-[hsl(270,55%,55%)] to-[hsl(270,55%,42%)]",
      sub: <Progress value={Math.min((data?.totalMinutes ?? 0) / 100, 100)} className="h-1.5 bg-white/20 mt-1 [&>div]:bg-white/80" />,
    },
    {
      title: "Success Rate",
      value: `${data?.successRate ?? 0}%`,
      icon: CheckCircle,
      gradient: "from-[hsl(174,62%,38%)] to-[hsl(174,62%,28%)]",
      sub: <span className="text-xs text-white/80">Completed calls</span>,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <div
          key={c.title}
          className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${c.gradient} p-5 text-white shadow-lg transition-transform hover:scale-[1.02]`}
        >
          {c.pulse && (
            <span className="absolute top-3 right-3 h-2.5 w-2.5 rounded-full bg-white animate-pulse" />
          )}
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-white/80">{c.title}</p>
            <c.icon className="h-5 w-5 text-white/60" />
          </div>
          <p className="mt-2 text-3xl font-bold">{c.value}</p>
          <div className="mt-1">{c.sub}</div>
        </div>
      ))}
    </div>
  );
}
