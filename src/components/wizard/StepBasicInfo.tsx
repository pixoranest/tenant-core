import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClientFormData, BUSINESS_TYPES, TIMEZONES } from "@/types/client";
import WizardField from "./WizardField";

interface Props {
  form: ClientFormData;
  set: (field: keyof ClientFormData, value: string | boolean | number) => void;
  errors: Partial<Record<keyof ClientFormData, string>>;
  isEdit: boolean;
}

export default function StepBasicInfo({ form, set, errors, isEdit }: Props) {
  return (
    <div className="grid gap-4">
      <WizardField label="Company Name" error={errors.name}>
        <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
      </WizardField>
      <WizardField label="Contact Person Name" error={errors.contact_name}>
        <Input value={form.contact_name} onChange={(e) => set("contact_name", e.target.value)} />
      </WizardField>
      <WizardField label="Email Address" error={errors.email}>
        <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} disabled={isEdit} />
      </WizardField>
      <WizardField label="Phone Number" error={errors.phone}>
        <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
      </WizardField>
      <WizardField label="Business Type" error={errors.business_type}>
        <Select value={form.business_type} onValueChange={(v) => set("business_type", v)}>
          <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
          <SelectContent>
            {BUSINESS_TYPES.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </WizardField>
      <WizardField label="Time Zone">
        <Select value={form.timezone} onValueChange={(v) => set("timezone", v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {TIMEZONES.map((tz) => (
              <SelectItem key={tz} value={tz}>{tz}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </WizardField>
      <div className="flex items-center justify-between">
        <Label>Account Status</Label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {form.status === "active" ? "Active" : "Inactive"}
          </span>
          <Switch
            checked={form.status === "active"}
            onCheckedChange={(c) => set("status", c ? "active" : "inactive")}
          />
        </div>
      </div>
    </div>
  );
}
