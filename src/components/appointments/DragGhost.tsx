import { cn } from "@/lib/utils";

export default function DragGhost({
  visible,
  x,
  y,
  label,
}: {
  visible: boolean;
  x: number;
  y: number;
  label: string;
}) {
  if (!visible) return null;

  return (
    <div
      className="fixed pointer-events-none z-50 rounded-md border border-primary bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary shadow-lg backdrop-blur-sm"
      style={{ left: x + 12, top: y - 10 }}
    >
      {label}
    </div>
  );
}
