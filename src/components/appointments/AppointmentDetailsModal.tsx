import { useState, useEffect, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppointmentDetails, useUpdateAppointment } from "@/hooks/useAppointments";
import { format, parse, differenceInDays, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  Phone, Mail, Calendar, Clock, MapPin, Play,
  CheckCircle, XCircle, UserX, Trash2, ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const statusColor: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  confirmed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  completed: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  no_show: "bg-muted text-muted-foreground",
};

export default function AppointmentDetailsModal({
  appointmentId,
  open,
  onOpenChange,
}: {
  appointmentId: string | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { data, isLoading } = useAppointmentDetails(appointmentId);
  const updateMut = useUpdateAppointment();
  const [notes, setNotes] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const apt = data?.appointment;
  const callLog = data?.callLog;

  useEffect(() => {
    if (apt?.notes != null) setNotes(apt.notes ?? "");
  }, [apt?.notes]);

  const saveNotes = useCallback(
    (value: string) => {
      if (!appointmentId) return;
      setSaveStatus("saving");
      updateMut.mutate(
        { id: appointmentId, updates: { notes: value } },
        {
          onSuccess: () => setSaveStatus("saved"),
          onError: () => setSaveStatus("idle"),
        }
      );
    },
    [appointmentId, updateMut]
  );

  const handleNotesChange = (value: string) => {
    setNotes(value);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => saveNotes(value), 2000);
  };

  const handleStatusUpdate = (status: string, timestampField?: string) => {
    if (!appointmentId) return;
    const updates: Record<string, unknown> = { status };
    if (timestampField) updates[timestampField] = new Date().toISOString();
    updateMut.mutate(
      { id: appointmentId, updates },
      { onSuccess: () => toast.success(`Marked as ${status.replace("_", " ")}`) }
    );
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[900px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <DialogTitle className="text-lg">Appointment Details</DialogTitle>
            {apt && (
              <Badge variant="secondary" className={cn("capitalize", statusColor[apt.status ?? ""])}>
                {(apt.status ?? "scheduled").replace("_", " ")}
              </Badge>
            )}
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
          </div>
        ) : apt ? (
          <div className="space-y-5">
            {/* Section 1: Appointment Info */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">Appointment Info</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(apt.appointment_date), "MMMM d, yyyy")}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {apt.appointment_time
                    ? format(parse(apt.appointment_time, "HH:mm:ss", new Date()), "h:mm a")
                    : "–"}{" "}
                  · {apt.duration_minutes ?? 30} min
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span className="capitalize">{(apt.source ?? "voice_agent").replace("_", " ")}</span>
                </div>
              </div>
              {differenceInDays(new Date(apt.appointment_date), new Date()) > 0 && (
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(apt.appointment_date), { addSuffix: true })}
                </p>
              )}
            </div>

            <Separator />

            {/* Section 2: Customer Info */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">Customer Info</h3>
              <div className="space-y-1.5 text-sm">
                <p className="font-medium">{apt.customer_name ?? "Unknown"}</p>
                {apt.customer_phone && (
                  <a href={`tel:${apt.customer_phone}`} className="flex items-center gap-2 text-primary hover:underline">
                    <Phone className="h-3.5 w-3.5" /> {apt.customer_phone}
                  </a>
                )}
                {apt.customer_email && (
                  <a href={`mailto:${apt.customer_email}`} className="flex items-center gap-2 text-primary hover:underline">
                    <Mail className="h-3.5 w-3.5" /> {apt.customer_email}
                  </a>
                )}
                {callLog?.recording_url && (
                  <Button variant="outline" size="sm" className="mt-1 gap-1.5 text-xs">
                    <Play className="h-3 w-3" /> Play Call Recording
                  </Button>
                )}
              </div>
            </div>

            <Separator />

            {/* Section 3: Notes */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Notes</h3>
                <span className="text-[11px] text-muted-foreground">
                  {saveStatus === "saving" ? "Saving…" : saveStatus === "saved" ? "Saved" : ""}
                </span>
              </div>
              <Textarea
                value={notes}
                onChange={(e) => handleNotesChange(e.target.value)}
                placeholder="Add notes about this appointment…"
                rows={3}
                className="resize-none text-sm"
              />
            </div>

            {/* Section 4: Related Call */}
            {callLog && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-foreground">Related Call</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm text-muted-foreground">
                    <div>
                      <p className="text-xs">Duration</p>
                      <p className="font-medium text-foreground">
                        {callLog.duration ? `${Math.round(callLog.duration / 60)}m ${callLog.duration % 60}s` : "–"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs">Outcome</p>
                      <p className="font-medium text-foreground capitalize">{callLog.outcome ?? "–"}</p>
                    </div>
                    <div>
                      <p className="text-xs">Cost</p>
                      <p className="font-medium text-foreground">{callLog.cost != null ? `$${callLog.cost}` : "–"}</p>
                    </div>
                    <div>
                      <p className="text-xs">Status</p>
                      <p className="font-medium text-foreground capitalize">{callLog.status ?? "–"}</p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Section 5: Calendar Sync */}
            <Separator />
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">Calendar Sync</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="rounded-lg border border-border p-3 text-sm">
                  <p className="font-medium mb-1">Google Calendar</p>
                  {apt.google_event_id ? (
                    <div className="space-y-1">
                      <Badge variant="secondary" className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Synced</Badge>
                      <p className="text-xs text-muted-foreground truncate">ID: {apt.google_event_id}</p>
                    </div>
                  ) : (
                    <Badge variant="secondary" className="text-[10px]">Not Synced</Badge>
                  )}
                </div>
                <div className="rounded-lg border border-border p-3 text-sm">
                  <p className="font-medium mb-1">Cal.com</p>
                  {apt.calcom_booking_id ? (
                    <div className="space-y-1">
                      <Badge variant="secondary" className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Synced</Badge>
                      <p className="text-xs text-muted-foreground truncate">ID: {apt.calcom_booking_id}</p>
                    </div>
                  ) : (
                    <Badge variant="secondary" className="text-[10px]">Not Synced</Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Section 6: Actions */}
            <Separator />
            <div className="flex flex-wrap gap-2">
              {apt.customer_phone && (
                <Button variant="outline" size="sm" className="gap-1.5" asChild>
                  <a href={`tel:${apt.customer_phone}`}><Phone className="h-3.5 w-3.5" /> Call Customer</a>
                </Button>
              )}
              {apt.status !== "completed" && (
                <Button
                  variant="outline" size="sm" className="gap-1.5"
                  onClick={() => handleStatusUpdate("completed", "completed_at")}
                >
                  <CheckCircle className="h-3.5 w-3.5" /> Mark Completed
                </Button>
              )}
              {apt.status !== "no_show" && (
                <Button
                  variant="outline" size="sm" className="gap-1.5"
                  onClick={() => handleStatusUpdate("no_show", "no_show_at")}
                >
                  <UserX className="h-3.5 w-3.5" /> Mark No-show
                </Button>
              )}
              {apt.status !== "cancelled" && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1.5 text-destructive hover:text-destructive">
                      <XCircle className="h-3.5 w-3.5" /> Cancel
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancel Appointment?</AlertDialogTitle>
                      <AlertDialogDescription>This will mark the appointment as cancelled.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Back</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleStatusUpdate("cancelled", "cancelled_at")}>
                        Confirm Cancel
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Appointment not found.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
