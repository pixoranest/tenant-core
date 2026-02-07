import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ClientFormData } from "@/types/client";
import WizardField from "./WizardField";

interface Props {
  form: ClientFormData;
  set: (field: keyof ClientFormData, value: string | boolean | number) => void;
  errors: Partial<Record<keyof ClientFormData, string>>;
}

const PLANS = [
  { value: "payg", label: "Pay-as-you-go", description: "Billed per minute of usage" },
  { value: "monthly_500", label: "Monthly 500", description: "500 included minutes per month" },
  { value: "monthly_1000", label: "Monthly 1000", description: "1000 included minutes per month" },
  { value: "enterprise", label: "Enterprise", description: "Custom pricing and terms" },
];

export default function StepBilling({ form, set, errors }: Props) {
  const isMonthlyPlan = form.billing_plan === "monthly_500" || form.billing_plan === "monthly_1000";

  return (
    <div className="grid gap-5">
      <WizardField label="Billing Plan">
        <RadioGroup
          value={form.billing_plan}
          onValueChange={(v) => set("billing_plan", v)}
          className="grid gap-2"
        >
          {PLANS.map((p) => (
            <label
              key={p.value}
              className="flex items-start gap-3 rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/50 transition-colors has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
            >
              <RadioGroupItem value={p.value} className="mt-0.5" />
              <div>
                <span className="text-sm font-medium">{p.label}</span>
                <p className="text-xs text-muted-foreground">{p.description}</p>
              </div>
            </label>
          ))}
        </RadioGroup>
      </WizardField>

      <div className="grid gap-4 sm:grid-cols-2">
        <WizardField label="Rate per Minute (₹)" error={errors.rate_per_minute}>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={form.rate_per_minute}
            onChange={(e) => set("rate_per_minute", e.target.value)}
          />
        </WizardField>
        <WizardField label="Overage Rate (₹)" error={errors.overage_rate}>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={form.overage_rate}
            onChange={(e) => set("overage_rate", e.target.value)}
          />
        </WizardField>
      </div>

      <WizardField label="Monthly Allowance (minutes)">
        <Input
          type="number"
          min="0"
          value={form.monthly_allowance}
          onChange={(e) => set("monthly_allowance", e.target.value)}
          disabled={!isMonthlyPlan}
        />
      </WizardField>

      <div className="flex items-center justify-between rounded-lg border border-border p-3">
        <div>
          <Label className="text-sm font-medium">Auto-Recharge</Label>
          <p className="text-xs text-muted-foreground">Automatically top up when balance is low</p>
        </div>
        <Switch
          checked={form.auto_recharge}
          onCheckedChange={(c) => set("auto_recharge", c)}
        />
      </div>

      <WizardField label="Low Balance Alert Threshold (minutes)">
        <Input
          type="number"
          min="0"
          value={form.low_balance_threshold}
          onChange={(e) => set("low_balance_threshold", e.target.value)}
        />
      </WizardField>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Checkbox
            id="has-trial"
            checked={form.has_trial}
            onCheckedChange={(c) => set("has_trial", !!c)}
          />
          <Label htmlFor="has-trial" className="font-normal cursor-pointer">
            Trial Period
          </Label>
        </div>
        {form.has_trial && (
          <WizardField label="Trial End Date" error={errors.trial_end_date}>
            <Input
              type="date"
              value={form.trial_end_date}
              onChange={(e) => set("trial_end_date", e.target.value)}
            />
          </WizardField>
        )}
      </div>
    </div>
  );
}
