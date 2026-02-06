import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PhoneCall, PhoneForwarded, Clock, TrendingUp } from "lucide-react";

const metrics = [
  { title: "Total Calls Today", value: "87", icon: PhoneCall },
  { title: "Active Calls", value: "3", icon: PhoneForwarded },
  { title: "Minutes Used This Month", value: "4,210", icon: Clock },
  { title: "Success Rate", value: "94.2%", icon: TrendingUp },
];

export default function Dashboard() {
  const { userProfile } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Welcome, {userProfile?.name ?? "there"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your business at a glance.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m) => (
          <Card key={m.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {m.title}
              </CardTitle>
              <m.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{m.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
