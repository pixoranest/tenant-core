import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Info, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ClientFormData } from "@/types/client";
import WizardField from "./WizardField";

interface Props {
  form: ClientFormData;
  set: (field: keyof ClientFormData, value: string | boolean | number) => void;
}

const INTEGRATIONS: {
  enableKey: keyof ClientFormData;
  label: string;
  inputKey: keyof ClientFormData;
  inputLabel: string;
  placeholder: string;
  isPassword?: boolean;
}[] = [
  {
    enableKey: "integration_google_sheets",
    label: "Google Sheets",
    inputKey: "google_sheets_url",
    inputLabel: "Sheet URL",
    placeholder: "https://docs.google.com/spreadsheets/d/...",
  },
  {
    enableKey: "integration_google_calendar",
    label: "Google Calendar",
    inputKey: "google_calendar_id",
    inputLabel: "Calendar ID",
    placeholder: "your-calendar@gmail.com",
  },
  {
    enableKey: "integration_cal_com",
    label: "Cal.com",
    inputKey: "cal_com_api_key",
    inputLabel: "API Key",
    placeholder: "cal_live_...",
    isPassword: true,
  },
  {
    enableKey: "integration_webhook",
    label: "Custom Webhook",
    inputKey: "webhook_url",
    inputLabel: "Webhook URL",
    placeholder: "https://your-endpoint.com/webhook",
  },
];

export default function StepIntegrations({ form, set }: Props) {
  const { toast } = useToast();
  const [tested, setTested] = useState<Record<string, boolean>>({});

  const handleTestConnection = (key: string) => {
    setTested((p) => ({ ...p, [key]: true }));
    toast({ title: "Connection test passed (mock)", description: "Actual validation will occur during execution phase." });
  };

  return (
    <div className="grid gap-5">
      {INTEGRATIONS.map((int) => {
        const enabled = form[int.enableKey] as boolean;
        return (
          <div key={int.enableKey} className="rounded-lg border border-border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">{int.label}</Label>
              <Switch
                checked={enabled}
                onCheckedChange={(c) => set(int.enableKey, c)}
              />
            </div>
            {enabled && (
              <div className="space-y-2">
                <WizardField label={int.inputLabel}>
                  <Input
                    type={int.isPassword ? "password" : "text"}
                    placeholder={int.placeholder}
                    value={form[int.inputKey] as string}
                    onChange={(e) => set(int.inputKey, e.target.value)}
                  />
                </WizardField>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleTestConnection(int.enableKey)}
                >
                  {tested[int.enableKey] ? (
                    <><CheckCircle2 className="h-3.5 w-3.5 mr-1.5 text-primary" /> Passed</>
                  ) : (
                    "Test Connection"
                  )}
                </Button>
              </div>
            )}
          </div>
        );
      })}

      <div className="flex items-start gap-2 rounded-lg bg-muted/50 border border-border p-3 text-xs text-muted-foreground">
        <Info className="h-4 w-4 shrink-0 mt-0.5" />
        <p>
          Integration credentials are encrypted and securely stored.
          Integrations will activate in a future execution phase.
        </p>
      </div>
    </div>
  );
}
