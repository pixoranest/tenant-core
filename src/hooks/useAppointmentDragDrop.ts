import { useState, useCallback, useRef } from "react";
import { useUpdateAppointment } from "./useAppointments";
import { format } from "date-fns";
import { toast } from "sonner";

export interface DragData {
  appointmentId: string;
  originalDate: string;
  originalTime: string;
}

export interface DropTarget {
  date: string; // yyyy-MM-dd
  hour: number;
  minutes: number; // 0, 15, 30, 45
}

export function useAppointmentDragDrop() {
  const [dragging, setDragging] = useState<DragData | null>(null);
  const [ghostPosition, setGhostPosition] = useState<{ x: number; y: number } | null>(null);
  const updateMut = useUpdateAppointment();

  const startDrag = useCallback((data: DragData) => {
    setDragging(data);
  }, []);

  const updateGhost = useCallback((x: number, y: number) => {
    setGhostPosition({ x, y });
  }, []);

  const cancelDrag = useCallback(() => {
    setDragging(null);
    setGhostPosition(null);
  }, []);

  const completeDrop = useCallback(
    (target: DropTarget) => {
      if (!dragging) return;

      const newTime = `${String(target.hour).padStart(2, "0")}:${String(target.minutes).padStart(2, "0")}:00`;
      const newDate = target.date;

      // Skip if same date/time
      if (newDate === dragging.originalDate && newTime === dragging.originalTime) {
        cancelDrag();
        return;
      }

      updateMut.mutate(
        {
          id: dragging.appointmentId,
          updates: {
            appointment_date: newDate,
            appointment_time: newTime,
            source: "manual_reschedule",
          },
        },
        {
          onSuccess: () => {
            toast.success("Appointment rescheduled successfully");
          },
          onError: () => {
            toast.error("Failed to reschedule appointment");
          },
        }
      );

      cancelDrag();
    },
    [dragging, updateMut, cancelDrag]
  );

  return {
    dragging,
    ghostPosition,
    startDrag,
    updateGhost,
    cancelDrag,
    completeDrop,
    isUpdating: updateMut.isPending,
  };
}

/** Snap a Y offset within a time cell to 0/15/30/45 minutes */
export function snapToSlot(offsetY: number, cellHeight: number): number {
  const fraction = Math.max(0, Math.min(offsetY / cellHeight, 1));
  const slot = Math.round(fraction * 3); // 0,1,2,3 → 0,15,30,45
  return slot * 15;
}
