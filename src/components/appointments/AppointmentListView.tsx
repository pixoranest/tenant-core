import { format, parse } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye } from "lucide-react";
import { cn } from "@/lib/utils";

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  status: string | null;
  source: string | null;
}

const statusColor: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  confirmed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  completed: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  no_show: "bg-muted text-muted-foreground",
};

export default function AppointmentListView({
  appointments,
  onSelectAppointment,
}: {
  appointments: Appointment[];
  onSelectAppointment: (id: string) => void;
}) {
  if (!appointments.length) return null;

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead className="hidden sm:table-cell">Phone</TableHead>
            <TableHead className="hidden md:table-cell">Email</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden sm:table-cell">Source</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {appointments.map((a) => (
            <TableRow key={a.id} className="cursor-pointer hover:bg-accent/40" onClick={() => onSelectAppointment(a.id)}>
              <TableCell className="text-sm">{format(new Date(a.appointment_date), "MMM d, yyyy")}</TableCell>
              <TableCell className="text-sm">
                {a.appointment_time
                  ? format(parse(a.appointment_time, "HH:mm:ss", new Date()), "h:mm a")
                  : "–"}
              </TableCell>
              <TableCell className="font-medium text-sm">{a.customer_name ?? "—"}</TableCell>
              <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{a.customer_phone ?? "—"}</TableCell>
              <TableCell className="hidden md:table-cell text-sm text-muted-foreground truncate max-w-[160px]">{a.customer_email ?? "—"}</TableCell>
              <TableCell>
                <Badge variant="secondary" className={cn("text-xs capitalize", statusColor[a.status ?? ""])}>
                  {(a.status ?? "scheduled").replace("_", " ")}
                </Badge>
              </TableCell>
              <TableCell className="hidden sm:table-cell text-xs text-muted-foreground capitalize">
                {(a.source ?? "voice_agent").replace("_", " ")}
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <Eye className="h-3.5 w-3.5" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
