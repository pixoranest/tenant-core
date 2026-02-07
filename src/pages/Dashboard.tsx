import { useAuth } from "@/hooks/useAuth";
import { useDashboardKPIs } from "@/hooks/useDashboardData";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import KPICards from "@/components/dashboard/KPICards";
import CallVolumeTrend from "@/components/dashboard/CallVolumeTrend";
import RecentCalls from "@/components/dashboard/RecentCalls";
import UpcomingAppointments from "@/components/dashboard/UpcomingAppointments";
import SystemStatus from "@/components/dashboard/SystemStatus";

export default function Dashboard() {
  const { userProfile } = useAuth();
  const { data: kpiData, isLoading: kpiLoading } = useDashboardKPIs();
  const queryClient = useQueryClient();

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["dashboard-kpis"] });
    queryClient.invalidateQueries({ queryKey: ["call-volume-trend"] });
    queryClient.invalidateQueries({ queryKey: ["recent-calls"] });
    queryClient.invalidateQueries({ queryKey: ["upcoming-appointments"] });
    queryClient.invalidateQueries({ queryKey: ["system-status"] });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Welcome back, {userProfile?.name ?? "there"}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {format(new Date(), "EEEE, MMMM d, yyyy · h:mm a")}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-2 self-start">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* KPI Cards */}
      <KPICards data={kpiData} isLoading={kpiLoading} />

      {/* Call Volume Trend */}
      <CallVolumeTrend />

      {/* Bottom row: Recent Calls + Right column */}
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <RecentCalls />
        </div>
        <div className="space-y-6 lg:col-span-2">
          <UpcomingAppointments />
          <SystemStatus />
        </div>
      </div>
    </div>
  );
}
