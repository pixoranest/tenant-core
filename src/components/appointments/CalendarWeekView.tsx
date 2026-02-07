import { useMemo, useRef, useCallback } from "react";
import { startOfWeek, addDays, format, isToday, parse } from "date-fns";
import { cn } from "@/lib/utils";
import { type DragData, type DropTarget, snapToSlot } from "@/hooks/useAppointmentDragDrop";

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  customer_name: string | null;
  customer_phone: string | null;
  status: string | null;
}

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8);
const CELL_HEIGHT = 48;

const statusStrip: Record<string, string> = {
  scheduled: "border-l-blue-500",
  confirmed: "border-l-green-500",
  completed: "border-l-purple-500",
  cancelled: "border-l-destructive",
  no_show: "border-l-foreground",
};

export default function CalendarWeekView({
  currentDate,
  appointments,
  onSelectAppointment,
  onDragStart,
  onDragMove,
  onDragEnd,
  draggingId,
}: {
  currentDate: Date;
  appointments: Appointment[];
  onSelectAppointment: (id: string) => void;
  onDragStart?: (data: DragData) => void;
  onDragMove?: (x: number, y: number) => void;
  onDragEnd?: (target: DropTarget) => void;
  draggingId?: string | null;
}) {
  const weekStart = startOfWeek(currentDate);
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const byDateHour = useMemo(() => {
    const map: Record<string, Appointment[]> = {};
    appointments.forEach((a) => {
      if (!a.appointment_time) return;
      const h = parseInt(a.appointment_time.split(":")[0], 10);
      const key = `${a.appointment_date}-${h}`;
      (map[key] ??= []).push(a);
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
    (e: React.MouseEvent, day: Date, hour: number) => {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const offsetY = e.clientY - rect.top;
      const minutes = snapToSlot(offsetY, CELL_HEIGHT);
      onDragEnd?.({ date: format(day, "yyyy-MM-dd"), hour, minutes });
    },
    [onDragEnd]
  );

  return (
    <div
      className="rounded-lg border border-border overflow-auto"
      onMouseMove={(e) => onDragMove?.(e.clientX, e.clientY)}
      onMouseUp={() => {
        // If mouse up on grid but not on a cell, cancel
      }}
    >
      <div className="min-w-[700px]">
        {/* Header */}
        <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border bg-muted sticky top-0 z-10">
          <div className="p-2" />
          {weekDays.map((d) => (
            <div
              key={d.toISOString()}
              className={cn(
                "p-2 text-center text-xs font-medium",
                isToday(d) && "text-primary font-semibold"
              )}
            >
              <div>{format(d, "EEE")}</div>
              <div className={cn(
                "mx-auto mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-sm",
                isToday(d) && "bg-primary text-primary-foreground"
              )}>
                {format(d, "d")}
              </div>
            </div>
          ))}
        </div>

        {/* Time grid */}
        {HOURS.map((hour) => (
          <div key={hour} className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border">
            <div className="p-1 text-right text-xs text-muted-foreground pr-2 pt-1">
              {format(parse(`${hour}:00`, "H:mm", new Date()), "h a")}
            </div>
            {weekDays.map((d) => {
              const key = `${format(d, "yyyy-MM-dd")}-${hour}`;
              const appts = byDateHour[key] ?? [];
              return (
                <div
                  key={key}
                  className={cn(
                    "min-h-[48px] border-l border-border p-0.5 transition-colors",
                    draggingId && "hover:bg-primary/5"
                  )}
                  onMouseUp={(e) => draggingId && handleCellDrop(e, d, hour)}
                >
                  {appts.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => !draggingId && onSelectAppointment(a.id)}
                      onMouseDown={(e) => handleMouseDown(e, a)}
                      className={cn(
                        "w-full rounded border-l-2 bg-accent/60 px-1.5 py-1 text-left text-[11px] leading-tight mb-0.5 hover:bg-accent transition-all cursor-grab active:cursor-grabbing",
                        statusStrip[a.status ?? ""] ?? "border-l-muted-foreground",
                        draggingId === a.id && "opacity-40 scale-95"
                      )}
                    >
                      <p className="font-medium truncate">{a.customer_name ?? "Customer"}</p>
                      <p className="text-muted-foreground truncate">{a.appointment_time?.slice(0, 5)}</p>
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
