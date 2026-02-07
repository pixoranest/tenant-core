import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Disc, CalendarCheck, ArrowRight, GraduationCap, Calendar, Timer } from "lucide-react";

const collections = [
  { key: "all", label: "All Recordings", icon: Disc },
  { key: "appointments", label: "Appointments Booked", icon: CalendarCheck },
  { key: "follow-up", label: "Needs Follow-up", icon: ArrowRight },
  { key: "training", label: "Training Material", icon: GraduationCap },
  { key: "this-week", label: "This Week's Calls", icon: Calendar },
  { key: "longest", label: "Longest Calls (>5 min)", icon: Timer },
] as const;

interface Props {
  current: string;
  onChange: (key: string) => void;
}

export default function SmartCollections({ current, onChange }: Props) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground px-2 mb-2">Collections</p>
      {collections.map((c) => (
        <Button
          key={c.key}
          variant="ghost"
          size="sm"
          className={cn(
            "w-full justify-start gap-2 text-sm font-normal h-8",
            current === c.key && "bg-accent text-accent-foreground font-medium"
          )}
          onClick={() => onChange(c.key)}
        >
          <c.icon className="h-3.5 w-3.5" />
          {c.label}
        </Button>
      ))}
    </div>
  );
}
