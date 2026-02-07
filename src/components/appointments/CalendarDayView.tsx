import { useMemo, useCallback } from "react";
import { format, parse } from "date-fns";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, Mail, Eye } from "lucide-react";
import { type DragData, type DropTarget, snapToSlot } from "@/hooks/useAppointmentDragDrop";

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  notes: string | null;
  status: string | null;
  duration_minutes: number | null;
}

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8);
const CELL_HEIGHT = 64;

const statusColor: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  confirmed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  completed: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  no_show: "bg-muted text-muted-foreground",
};

export default function CalendarDayView({
  appointments,
  onSelectAppointment,
  currentDate,
  onDragStart,
  onDragMove,
  onDragEnd,
  draggingId,
}: {
  appointments: Appointment[];
  onSelectAppointment: (id: string) => void;
  currentDate?: string;
  onDragStart?: (data: DragData) => void;
  onDragMove?: (x: number, y: number) => void;
  onDragEnd?: (target: DropTarget) => void;
  draggingId?: string | null;
}) {
  const byHour = useMemo(() => {
    const map: Record<number, Appointment[]> = {};
    appointments.forEach((a) => {
      if (!a.appointment_time) return;
      const h = parseInt(a.appointment_time.split(":")[0], 10);
      (map[h] ??= []).push(a);
    });
    return map;
  }, [appointments]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, a: Appointment) => {
      e.preventDefault();
      e.stopPropagation();
      onDragStart?.({
        appointmentId: a.id,
        originalDate: a.appointment_date,
        originalTime: a.appointment_time,
      });
    },
    [onDragStart]
  );

  const handleCellDrop = useCallback(
    (e: React.MouseEvent, hour: number) => {
      if (!draggingId || !currentDate) return;
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const offsetY = e.clientY - rect.top;
      const minutes = snapToSlot(offsetY, CELL_HEIGHT);
      onDragEnd?.({ date: currentDate, hour, minutes });
    },
    [draggingId, currentDate, onDragEnd]
  );

  return (
    <div
      className="rounded-lg border border-border overflow-hidden"
      onMouseMove={(e) => onDragMove?.(e.clientX, e.clientY)}
    >
      {HOURS.map((hour) => {
        const appts = byHour[hour] ?? [];
        return (
          <div
            key={hour}
            className={cn(
              "flex border-b border-border last:border-0",
              draggingId && "hover:bg-primary/5"
            )}
            onMouseUp={(e) => draggingId && handleCellDrop(e, hour)}
          >
            <div className="w-16 shrink-0 border-r border-border p-2 text-right text-xs text-muted-foreground">
              {format(parse(`${hour}:00`, "H:mm", new Date()), "h a")}
            </div>
            <div className="flex-1 min-h-[64px] p-1.5 space-y-1.5">
              {appts.map((a) => (
                <div
                  key={a.id}
                  className={cn(
                    "rounded-lg border border-border bg-card p-3 hover:shadow-md transition-all cursor-grab active:cursor-grabbing",
                    draggingId === a.id && "opacity-40 scale-95"
                  )}
                  onClick={() => !draggingId && onSelectAppointment(a.id)}
                  onMouseDown={(e) => handleMouseDown(e, a)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm truncate">{a.customer_name ?? "Customer"}</p>
                        <Badge variant="secondary" className={cn("text-[10px]", statusColor[a.status ?? ""])}>
                          {a.status ?? "scheduled"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {a.appointment_time?.slice(0, 5)} · {a.duration_minutes ?? 30} min
                      </p>
                      {a.notes && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">{a.notes}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {a.customer_phone && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                          <a href={`tel:${a.customer_phone}`}><Phone className="h-3.5 w-3.5" /></a>
                        </Button>
                      )}
                      {a.customer_email && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                          <a href={`mailto:${a.customer_email}`}><Mail className="h-3.5 w-3.5" /></a>
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onSelectAppointment(a.id); }}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
