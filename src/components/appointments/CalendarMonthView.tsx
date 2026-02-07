import { useMemo } from "react";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, format, isToday,
} from "date-fns";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  customer_name: string | null;
  status: string | null;
}

const statusDot: Record<string, string> = {
  scheduled: "bg-blue-500",
  confirmed: "bg-green-500",
  completed: "bg-purple-500",
  cancelled: "bg-destructive",
  no_show: "bg-foreground",
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarMonthView({
  currentDate,
  appointments,
  onSelectDay,
  onSelectAppointment,
}: {
  currentDate: Date;
  appointments: Appointment[];
  onSelectDay: (date: Date) => void;
  onSelectAppointment: (id: string) => void;
}) {
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate));
    const end = endOfWeek(endOfMonth(currentDate));
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const byDate = useMemo(() => {
    const map: Record<string, Appointment[]> = {};
    appointments.forEach((a) => {
      const key = a.appointment_date;
      (map[key] ??= []).push(a);
    });
    return map;
  }, [appointments]);

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="grid grid-cols-7 bg-muted">
        {WEEKDAYS.map((d) => (
          <div key={d} className="px-2 py-2 text-center text-xs font-medium text-muted-foreground">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dayAppts = byDate[key] ?? [];
          const inMonth = isSameMonth(day, currentDate);
          const today = isToday(day);

          return (
            <button
              key={key}
              onClick={() => onSelectDay(day)}
              className={cn(
                "relative min-h-[80px] sm:min-h-[100px] border-b border-r border-border p-1.5 text-left transition-colors hover:bg-accent/40",
                !inMonth && "bg-muted/40 text-muted-foreground/50"
              )}
            >
              <span
                className={cn(
                  "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                  today && "bg-primary text-primary-foreground"
                )}
              >
                {format(day, "d")}
              </span>
              {dayAppts.length > 0 && (
                <div className="mt-0.5 space-y-0.5">
                  {dayAppts.slice(0, 3).map((a) => (
                    <Tooltip key={a.id}>
                      <TooltipTrigger asChild>
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectAppointment(a.id);
                          }}
                          className="flex items-center gap-1 rounded px-1 py-0.5 text-[10px] leading-tight hover:bg-accent cursor-pointer truncate"
                        >
                          <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", statusDot[a.status ?? ""] ?? "bg-muted-foreground")} />
                          <span className="truncate">{a.customer_name ?? "Customer"}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="text-xs">
                        <p className="font-medium">{a.customer_name ?? "Customer"}</p>
                        <p className="text-muted-foreground">{a.appointment_time?.slice(0, 5)}</p>
                        <p className="capitalize">{a.status}</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                  {dayAppts.length > 3 && (
                    <p className="px-1 text-[10px] text-muted-foreground">+{dayAppts.length - 3} more</p>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
