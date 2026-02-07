import { Label } from "@/components/ui/label";

interface Props {
  label: string;
  error?: string;
  children: React.ReactNode;
}

export default function WizardField({ label, error, children }: Props) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-sm">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
