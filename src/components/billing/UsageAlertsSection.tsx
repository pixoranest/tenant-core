import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Bell, AlertTriangle, CreditCard, Clock } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function UsageAlertsSection() {
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [usageThreshold, setUsageThreshold] = useState([80]);
  const [overageNotify, setOverageNotify] = useState(true);
  const [paymentReminder, setPaymentReminder] = useState("3");

  // Simulated alert history
  const alertHistory = [
    {
      id: 1,
      time: "2026-02-05 14:30",
      type: "Usage Threshold",
      message: "You've used 80% of your monthly minutes",
      status: "sent",
    },
    {
      id: 2,
      time: "2026-02-01 09:00",
      type: "Payment Due",
      message: "Invoice #INV-2026-001 is due in 3 days",
      status: "read",
    },
    {
      id: 3,
      time: "2026-01-28 16:45",
      type: "Overage",
      message: "You've exceeded your monthly allowance",
      status: "sent",
    },
  ];

  const statusBadge: Record<string, string> = {
    sent: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20",
    read: "bg-muted text-muted-foreground border-border",
    failed: "bg-destructive/15 text-destructive border-destructive/20",
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Usage Alerts & Notifications</CardTitle>
        <div className="flex items-center gap-2">
          <Label htmlFor="alerts-toggle" className="text-sm text-muted-foreground">
            {alertsEnabled ? "Enabled" : "Disabled"}
          </Label>
          <Switch
            id="alerts-toggle"
            checked={alertsEnabled}
            onCheckedChange={setAlertsEnabled}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {alertsEnabled && (
          <>
            {/* Alert 1: Usage Threshold */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <p className="text-sm font-medium">Usage Threshold Alert</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Notify when usage reaches {usageThreshold[0]}% of allowance
              </p>
              <Slider
                value={usageThreshold}
                onValueChange={setUsageThreshold}
                min={50}
                max={100}
                step={5}
                className="max-w-xs"
              />
              <div className="flex gap-4 text-xs text-muted-foreground">
                <label className="flex items-center gap-1.5">
                  <input type="checkbox" defaultChecked className="rounded" /> Email
                </label>
                <label className="flex items-center gap-1.5">
                  <input type="checkbox" className="rounded" /> SMS
                </label>
              </div>
            </div>

            <Separator />

            {/* Alert 2: Overage */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-destructive" />
                <p className="text-sm font-medium">Overage Warning</p>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={overageNotify} onCheckedChange={setOverageNotify} />
                <Label className="text-sm">Trigger on first overage minute</Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Immediate alert + daily summary when in overage
              </p>
            </div>

            <Separator />

            {/* Alert 3: Payment Due */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" />
                <p className="text-sm font-medium">Payment Due Reminder</p>
              </div>
              <div className="flex items-center gap-2">
                <Select value={paymentReminder} onValueChange={setPaymentReminder}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 day before</SelectItem>
                    <SelectItem value="3">3 days before</SelectItem>
                    <SelectItem value="5">5 days before</SelectItem>
                    <SelectItem value="7">7 days before</SelectItem>
                  </SelectContent>
                </Select>
                <Label className="text-sm text-muted-foreground">before due date</Label>
              </div>
            </div>

            <Separator />

            {/* Alert History */}
            <div>
              <p className="text-sm font-medium mb-3 flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Alert History
              </p>
              <div className="space-y-2">
                {alertHistory.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between rounded-lg border border-border p-3 text-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{alert.type}</span>
                        <Badge variant="outline" className={statusBadge[alert.status] ?? ""}>
                          {alert.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{alert.message}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-3">
                      {alert.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
