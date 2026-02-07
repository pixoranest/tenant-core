import { Badge } from "@/components/ui/badge";
import { Bell, CheckCircle, Clock } from "lucide-react";

interface ReminderStatusProps {
  reminder24hSent?: boolean;
  reminder24hSentAt?: string | null;
  reminder2hSent?: boolean;
  reminder2hSentAt?: string | null;
}

export default function ReminderStatus({
  reminder24hSent,
  reminder24hSentAt,
  reminder2hSent,
  reminder2hSentAt,
}: ReminderStatusProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <Bell className="h-3.5 w-3.5" /> Reminders
      </h3>
      <div className="grid sm:grid-cols-2 gap-2">
        <ReminderChip
          label="24-hour reminder"
          sent={!!reminder24hSent}
          sentAt={reminder24hSentAt}
        />
        <ReminderChip
          label="2-hour reminder"
          sent={!!reminder2hSent}
          sentAt={reminder2hSentAt}
        />
      </div>
    </div>
  );
}

function ReminderChip({
  label,
  sent,
  sentAt,
}: {
  label: string;
  sent: boolean;
  sentAt?: string | null;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border p-2.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      {sent ? (
        <Badge variant="secondary" className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 gap-1">
          <CheckCircle className="h-2.5 w-2.5" /> Sent
        </Badge>
      ) : (
        <Badge variant="secondary" className="text-[10px] gap-1">
          <Clock className="h-2.5 w-2.5" /> Scheduled
        </Badge>
      )}
    </div>
  );
}
