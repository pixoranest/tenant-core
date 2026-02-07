import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays, ChevronLeft, ChevronRight, List } from "lucide-react";
import {
  addMonths, subMonths, addWeeks, subWeeks, addDays, subDays,
  format, startOfToday,
} from "date-fns";
import { useAppointments, type CalendarView } from "@/hooks/useAppointments";
import CalendarMonthView from "@/components/appointments/CalendarMonthView";
import CalendarWeekView from "@/components/appointments/CalendarWeekView";
import CalendarDayView from "@/components/appointments/CalendarDayView";
import AppointmentListView from "@/components/appointments/AppointmentListView";
import AppointmentDetailsModal from "@/components/appointments/AppointmentDetailsModal";
import AppointmentInsights from "@/components/appointments/AppointmentInsights";
import SyncStatusBar from "@/components/appointments/SyncStatusBar";

export default function Appointments() {
  const [view, setView] = useState<CalendarView>("month");
  const [currentDate, setCurrentDate] = useState(startOfToday());
  const [listFilter, setListFilter] = useState("upcoming");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: appointments, isLoading } = useAppointments(view, currentDate, listFilter);

  const navigate = useCallback(
    (dir: -1 | 1) => {
      setCurrentDate((d) => {
        if (view === "month") return dir === 1 ? addMonths(d, 1) : subMonths(d, 1);
        if (view === "week") return dir === 1 ? addWeeks(d, 1) : subWeeks(d, 1);
        return dir === 1 ? addDays(d, 1) : subDays(d, 1);
      });
    },
    [view]
  );

  const goToday = () => setCurrentDate(startOfToday());

  const handleSelectDay = (date: Date) => {
    setCurrentDate(date);
    setView("day");
  };

  const periodLabel =
    view === "month"
      ? format(currentDate, "MMMM yyyy")
      : view === "week"
        ? `Week of ${format(currentDate, "MMM d, yyyy")}`
        : format(currentDate, "EEEE, MMMM d, yyyy");

  return (
    <div className="space-y-5">
      {/* Sync Status */}
      <SyncStatusBar />

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Appointments</h1>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={view} onValueChange={(v) => setView(v as CalendarView)}>
            <TabsList className="h-8">
              <TabsTrigger value="month" className="text-xs px-2.5 h-6">Month</TabsTrigger>
              <TabsTrigger value="week" className="text-xs px-2.5 h-6">Week</TabsTrigger>
              <TabsTrigger value="day" className="text-xs px-2.5 h-6">Day</TabsTrigger>
              <TabsTrigger value="list" className="text-xs px-2.5 h-6">
                <List className="h-3 w-3 mr-1" /> List
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Navigation */}
      {view !== "list" && (
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={goToday}>
            Today
          </Button>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[180px] text-center">{periodLabel}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* List filter */}
      {view === "list" && (
        <div className="flex items-center gap-3">
          <Select value={listFilter} onValueChange={setListFilter}>
            <SelectTrigger className="w-[160px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="past">Past</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="no_show">No-show</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Calendar / List */}
      {isLoading ? (
        <Skeleton className="h-[400px] rounded-lg" />
      ) : (appointments?.length ?? 0) === 0 && view === "list" ? (
        <div className="flex flex-col items-center py-16 text-center">
          <CalendarDays className="mb-4 h-12 w-12 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No appointments found.</p>
          <p className="text-xs text-muted-foreground mt-1">Appointments will appear here once calls generate bookings.</p>
        </div>
      ) : (
        <>
          {view === "month" && (
            <CalendarMonthView
              currentDate={currentDate}
              appointments={appointments ?? []}
              onSelectDay={handleSelectDay}
              onSelectAppointment={setSelectedId}
            />
          )}
          {view === "week" && (
            <CalendarWeekView
              currentDate={currentDate}
              appointments={appointments ?? []}
              onSelectAppointment={setSelectedId}
            />
          )}
          {view === "day" && (
            <CalendarDayView
              appointments={appointments ?? []}
              onSelectAppointment={setSelectedId}
            />
          )}
          {view === "list" && (
            <AppointmentListView
              appointments={appointments ?? []}
              onSelectAppointment={setSelectedId}
            />
          )}
        </>
      )}

      {/* Insights */}
      <AppointmentInsights />

      {/* Details Modal */}
      <AppointmentDetailsModal
        appointmentId={selectedId}
        open={!!selectedId}
        onOpenChange={(v) => { if (!v) setSelectedId(null); }}
      />
    </div>
  );
}
