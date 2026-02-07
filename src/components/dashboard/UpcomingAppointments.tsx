import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useUpcomingAppointments } from "@/hooks/useDashboardData";
import { CalendarDays, User, Phone } from "lucide-react";
import { format, parse } from "date-fns";
import { Link } from "react-router-dom";

const statusColors: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  confirmed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export default function UpcomingAppointments() {
  const { data: appointments, isLoading } = useUpcomingAppointments();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold">Upcoming Appointments</CardTitle>
        <Link
          to="/dashboard/appointments"
          className="text-sm font-medium text-primary hover:underline"
        >
          View Calendar
        </Link>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        ) : !appointments?.length ? (
          <div className="flex flex-col items-center py-8 text-center">
            <CalendarDays className="mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No upcoming appointments</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {appointments.map((apt) => (
              <li
                key={apt.id}
                className="flex items-center gap-3 rounded-lg border border-border px-3 py-3"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <CalendarDays className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    {apt.customer_name ?? "Unknown"}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    {format(new Date(apt.appointment_date), "MMM d, yyyy")} at{" "}
                    {apt.appointment_time
                      ? format(parse(apt.appointment_time, "HH:mm:ss", new Date()), "h:mm a")
                      : "–"}
                    {apt.customer_phone && (
                      <>
                        <span className="mx-1">·</span>
                        <Phone className="h-3 w-3" />
                        {apt.customer_phone}
                      </>
                    )}
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className={statusColors[apt.status ?? ""] ?? ""}
                >
                  {apt.status ?? "scheduled"}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
