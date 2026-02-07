import { useState, useEffect, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Check, Loader2 } from "lucide-react";

interface Props {
  notes: string;
  onSave: (notes: string) => void;
}

export default function NotesSection({ notes: initialNotes, onSave }: Props) {
  const [value, setValue] = useState(initialNotes);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setValue(initialNotes);
  }, [initialNotes]);

  useEffect(() => {
    if (value === initialNotes) return;
    setSaveStatus("idle");
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setSaveStatus("saving");
      onSave(value);
      setTimeout(() => setSaveStatus("saved"), 500);
      setTimeout(() => setSaveStatus("idle"), 3000);
    }, 2000);

    return () => clearTimeout(timerRef.current);
  }, [value, initialNotes, onSave]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">Notes</p>
        {saveStatus === "saving" && (
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Loader2 className="h-2.5 w-2.5 animate-spin" /> Saving…
          </span>
        )}
        {saveStatus === "saved" && (
          <span className="text-[10px] text-primary flex items-center gap-1">
            <Check className="h-2.5 w-2.5" /> Saved
          </span>
        )}
      </div>
      <Textarea
        placeholder="Add notes about this call…"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="text-xs min-h-[80px] resize-none"
      />
    </div>
  );
}
