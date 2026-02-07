import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Copy, CheckCircle2, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ClientFormData } from "@/types/client";
import WizardField from "./WizardField";

interface Props {
  form: ClientFormData;
  set: (field: keyof ClientFormData, value: string | boolean | number) => void;
  errors: Partial<Record<keyof ClientFormData, string>>;
  generatedPassword: string;
}

const SESSION_OPTIONS = [
  { value: "15", label: "15 minutes" },
  { value: "30", label: "30 minutes" },
  { value: "60", label: "1 hour" },
  { value: "240", label: "4 hours" },
];

export default function StepNotificationsSecurity({ form, set, errors, generatedPassword }: Props) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [webhookTested, setWebhookTested] = useState(false);

  const copyPassword = () => {
    navigator.clipboard.writeText(generatedPassword);
    setCopied(true);
    toast({ title: "Password copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  const testWebhook = () => {
    setWebhookTested(true);
    toast({ title: "Webhook test sent (mock)", description: "Actual delivery will occur during execution phase." });
  };

  return (
    <div className="grid gap-6">
      {/* Section A: Email Notifications */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Email Notifications</h3>
        <div className="grid gap-2">
          {([
            { key: "notif_daily_summary", label: "Daily Summary Report" },
            { key: "notif_weekly_report", label: "Weekly Analytics Report" },
            { key: "notif_low_balance", label: "Low Balance Alerts" },
            { key: "notif_call_failure", label: "Call Failure Alerts" },
          ] as const).map(({ key, label }) => (
            <div key={key} className="flex items-center gap-2">
              <Checkbox
                id={key}
                checked={form[key] as boolean}
                onCheckedChange={(c) => set(key, !!c)}
              />
              <Label htmlFor={key} className="font-normal cursor-pointer text-sm">{label}</Label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Section B: SMS */}
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm font-medium">SMS Notifications</Label>
          <p className="text-xs text-muted-foreground">Preferences will apply when messaging is enabled</p>
        </div>
        <Switch
          checked={form.notif_sms}
          onCheckedChange={(c) => set("notif_sms", c)}
        />
      </div>

      <Separator />

      {/* Section C: Webhook */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Webhook Notifications</Label>
          <Switch
            checked={form.notif_webhook}
            onCheckedChange={(c) => set("notif_webhook", c)}
          />
        </div>
        {form.notif_webhook && (
          <div className="space-y-2">
            <WizardField label="Webhook URL" error={errors.notif_webhook_url}>
              <Input
                placeholder="https://your-endpoint.com/notifications"
                value={form.notif_webhook_url}
                onChange={(e) => set("notif_webhook_url", e.target.value)}
              />
            </WizardField>
            <Button type="button" variant="outline" size="sm" onClick={testWebhook}>
              {webhookTested ? (
                <><CheckCircle2 className="h-3.5 w-3.5 mr-1.5 text-primary" /> Sent</>
              ) : (
                "Test Webhook"
              )}
            </Button>
          </div>
        )}
      </div>

      <Separator />

      {/* Section D: Security */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Security Settings</h3>

        <WizardField label="Password Policy">
          <RadioGroup
            value={form.password_mode}
            onValueChange={(v) => set("password_mode", v)}
            className="grid gap-2"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="auto" id="pw-auto" />
              <Label htmlFor="pw-auto" className="font-normal cursor-pointer text-sm">Auto-generate secure password</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="manual" id="pw-manual" />
              <Label htmlFor="pw-manual" className="font-normal cursor-pointer text-sm">Set password manually</Label>
            </div>
          </RadioGroup>
        </WizardField>

        {form.password_mode === "auto" && (
          <div className="flex items-center gap-2 rounded-lg bg-muted/50 border border-border p-3">
            <code className="flex-1 text-sm font-mono text-foreground break-all">{generatedPassword}</code>
            <Button type="button" variant="ghost" size="icon" onClick={copyPassword}>
              {copied ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        )}

        {form.password_mode === "manual" && (
          <div className="grid gap-3">
            <WizardField label="Password" error={errors.manual_password}>
              <Input
                type="password"
                value={form.manual_password}
                onChange={(e) => set("manual_password", e.target.value)}
              />
            </WizardField>
            <WizardField label="Confirm Password" error={errors.manual_password_confirm}>
              <Input
                type="password"
                value={form.manual_password_confirm}
                onChange={(e) => set("manual_password_confirm", e.target.value)}
              />
            </WizardField>
          </div>
        )}

        <div className="flex items-center justify-between rounded-lg border border-border p-3">
          <div>
            <Label className="text-sm font-medium">Two-Factor Authentication</Label>
            <p className="text-xs text-muted-foreground">Will be enforced when available</p>
          </div>
          <Switch
            checked={form.two_factor_enabled}
            onCheckedChange={(c) => set("two_factor_enabled", c)}
          />
        </div>

        <WizardField label="Session Timeout">
          <Select value={form.session_timeout} onValueChange={(v) => set("session_timeout", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {SESSION_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </WizardField>
      </div>
    </div>
  );
}
