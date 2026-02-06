import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Bot, PhoneCall, Activity } from "lucide-react";

const metrics = [
  { title: "Total Clients", value: "24", icon: Users },
  { title: "Active Voice Agents", value: "12", icon: Bot },
  { title: "Total Calls Today", value: "348", icon: PhoneCall },
  { title: "System Status", value: "Operational", icon: Activity },
];

export default function AdminDashboard() {
  const { userProfile } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Welcome, {userProfile?.name ?? "Admin"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here's an overview of your platform.
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
