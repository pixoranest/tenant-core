import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useBillingOverview, useDailyUsageChart } from "@/hooks/useBillingData";
import BillingOverviewCards from "@/components/billing/BillingOverviewCards";
import UsageDetailsCard from "@/components/billing/UsageDetailsCard";
import InvoicesSection from "@/components/billing/InvoicesSection";
import PaymentMethodsSection from "@/components/billing/PaymentMethodsSection";
import UsageAlertsSection from "@/components/billing/UsageAlertsSection";

const STATUS_BADGE: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  near_limit: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20",
  over_limit: "bg-destructive/15 text-destructive border-destructive/20",
};

const STATUS_LABEL: Record<string, string> = {
  active: "Active",
  near_limit: "Near Limit",
  over_limit: "Over Limit",
};

export default function Billing() {
  const { data: overview, isLoading } = useBillingOverview();
  const { data: dailyData } = useDailyUsageChart();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Billing & Usage</h1>
          {overview && (
            <p className="text-sm text-muted-foreground">
              {overview.cycleStart} – {overview.cycleEnd} · {overview.daysLeft} days remaining
            </p>
          )}
        </div>
        {overview && (
          <Badge variant="outline" className={STATUS_BADGE[overview.usageStatus] ?? ""}>
            {STATUS_LABEL[overview.usageStatus] ?? "Active"}
          </Badge>
        )}
      </div>

      {/* Section 1: Overview Cards */}
      {overview && <BillingOverviewCards data={overview} />}

      {/* Section 2: Usage Details */}
      {overview && dailyData && (
        <UsageDetailsCard dailyData={dailyData} overview={overview} />
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Section 3: Invoices */}
        <InvoicesSection />

        {/* Section 4: Payment Methods */}
        <PaymentMethodsSection />
      </div>

      {/* Section 5: Alerts */}
      <UsageAlertsSection />
    </div>
  );
}
