import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, CheckCircle2, Info } from "lucide-react";

interface Props {
  clientId: string;
}

interface NotificationRow {
  id: string;
  client_id: string;
  email_daily_summary: boolean | null;
  email_weekly_report: boolean | null;
  email_low_balance: boolean | null;
  email_call_failure: boolean | null;
  sms_notifications: boolean | null;
  webhook_notifications: boolean | null;
  webhook_url: string | null;
}

export default function ClientNotifications({ clientId }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<NotificationRow | null>(null);
  const [webhookTested, setWebhookTested] = useState(false);

  const { data: notif, isLoading } = useQuery({
    queryKey: ["client-notifications", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_notifications")
        .select("*")
        .eq("client_id", clientId)
        .maybeSingle();
      if (error) throw error;
      return data as NotificationRow | null;
    },
  });

  useEffect(() => {
    if (notif) setForm({ ...notif });
  }, [notif]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form) return;
      const payload = {
        email_daily_summary: form.email_daily_summary,
        email_weekly_report: form.email_weekly_report,
        email_low_balance: form.email_low_balance,
        email_call_failure: form.email_call_failure,
        sms_notifications: form.sms_notifications,
        webhook_notifications: form.webhook_notifications,
        webhook_url: form.webhook_notifications ? form.webhook_url : null,
      };
      if (notif) {
        const { error } = await supabase
          .from("client_notifications")
          .update(payload as any)
          .eq("client_id", clientId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("client_notifications")
          .insert({ client_id: clientId, ...payload } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-notifications", clientId] });
      toast({ title: "Notification settings saved" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  if (isLoading) return <Skeleton className="h-48 lg:col-span-2" />;
  if (!form) return null;

  const set = <K extends keyof NotificationRow>(key: K, value: NotificationRow[K]) =>
    setForm((f) => (f ? { ...f, [key]: value } : f));

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <Bell className="h-4 w-4" /> Notification Preferences
        </CardTitle>
        <Button size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? "Saving…" : "Save Notification Settings"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Email Notifications */}
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Email Notifications</h4>
          <div className="grid gap-2">
            {([
              { key: "email_daily_summary" as const, label: "Daily Summary Report" },
              { key: "email_weekly_report" as const, label: "Weekly Analytics Report" },
              { key: "email_low_balance" as const, label: "Low Balance Alerts" },
              { key: "email_call_failure" as const, label: "Call Failure Alerts" },
            ]).map(({ key, label }) => (
              <div key={key} className="flex items-center gap-2">
                <Checkbox
                  id={`notif-${key}`}
                  checked={!!form[key]}
                  onCheckedChange={(c) => set(key, !!c)}
                />
                <Label htmlFor={`notif-${key}`} className="font-normal cursor-pointer text-sm">{label}</Label>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* SMS */}
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-medium">SMS Notifications</Label>
            <p className="text-xs text-muted-foreground">Preferences will apply when messaging is enabled.</p>
          </div>
          <Switch
            checked={!!form.sms_notifications}
            onCheckedChange={(c) => set("sms_notifications", c)}
          />
        </div>

        <Separator />

        {/* Webhook */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Webhook Notifications</Label>
            <Switch
              checked={!!form.webhook_notifications}
              onCheckedChange={(c) => set("webhook_notifications", c)}
            />
          </div>
          {form.webhook_notifications && (
            <div className="space-y-2">
              <div className="grid gap-1.5">
                <Label className="text-sm">Webhook URL</Label>
                <Input
                  placeholder="https://your-endpoint.com/notifications"
                  value={form.webhook_url ?? ""}
                  onChange={(e) => set("webhook_url", e.target.value)}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setWebhookTested(true);
                  toast({ title: "Webhook test sent (mock)" });
                }}
                disabled={!form.webhook_url?.trim()}
              >
                {webhookTested ? (
                  <><CheckCircle2 className="h-3.5 w-3.5 mr-1.5 text-primary" /> Sent</>
                ) : (
                  "Test Webhook"
                )}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
