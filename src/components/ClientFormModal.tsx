import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  ClientFormData,
  ClientRecord,
  EMPTY_CLIENT_FORM,
  BUSINESS_TYPES,
  TIMEZONES,
} from "@/types/client";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editClient?: ClientRecord | null;
}

export default function ClientFormModal({ open, onOpenChange, editClient }: Props) {
  const isEdit = !!editClient;
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<ClientFormData>(EMPTY_CLIENT_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof ClientFormData, string>>>({});
  const [createdCreds, setCreatedCreds] = useState<{ email: string; password: string } | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!open) {
      setStep(1);
      setErrors({});
      setCreatedCreds(null);
      return;
    }
    if (editClient) {
      setForm({
        name: editClient.name,
        contact_name: editClient.contact_name ?? "",
        email: editClient.email,
        phone: editClient.phone ?? "",
        business_type: editClient.business_type ?? "",
        timezone: editClient.timezone ?? "Asia/Kolkata",
        status: editClient.status,
        billing_plan: editClient.billing_plan ?? "payg",
        rate_per_minute: String(editClient.rate_per_minute ?? "2.5"),
        monthly_allowance: String(editClient.monthly_allowance ?? "0"),
        overage_rate: String(editClient.overage_rate ?? "3.0"),
        has_trial: !!editClient.trial_end_date,
        trial_end_date: editClient.trial_end_date
          ? new Date(editClient.trial_end_date).toISOString().slice(0, 10)
          : "",
      });
    } else {
      setForm(EMPTY_CLIENT_FORM);
    }
  }, [open, editClient]);

  const set = (field: keyof ClientFormData, value: string | boolean) =>
    setForm((f) => ({ ...f, [field]: value }));

  // ---- Validation ----
  const validateStep1 = (): boolean => {
    const e: typeof errors = {};
    if (!form.name.trim()) e.name = "Company name is required";
    if (!form.contact_name.trim()) e.contact_name = "Contact name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Invalid email";
    if (!form.phone.trim()) e.phone = "Phone is required";
    else if (!/^\+?[\d\s()-]{7,20}$/.test(form.phone)) e.phone = "Invalid phone number";
    if (!form.business_type) e.business_type = "Select a business type";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = (): boolean => {
    const e: typeof errors = {};
    if (Number(form.rate_per_minute) < 0) e.rate_per_minute = "Must be ≥ 0";
    if (Number(form.overage_rate) < 0) e.overage_rate = "Must be ≥ 0";
    if (form.has_trial && !form.trial_end_date) e.trial_end_date = "Select trial end date";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ---- Mutations ----
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        name: form.name.trim(),
        contact_name: form.contact_name.trim() || null,
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        business_type: form.business_type || null,
        timezone: form.timezone,
        status: form.status,
        billing_plan: form.billing_plan,
        rate_per_minute: Number(form.rate_per_minute),
        monthly_allowance: Number(form.monthly_allowance),
        overage_rate: Number(form.overage_rate),
        trial_end_date: form.has_trial && form.trial_end_date ? form.trial_end_date : null,
      };

      if (isEdit) {
        // Update client
        const { error } = await supabase
          .from("clients")
          .update(payload as any)
          .eq("id", editClient!.id);
        if (error) throw error;

        // If deactivated, deactivate associated users
        if (form.status === "inactive" && editClient!.status !== "inactive") {
          await supabase
            .from("users")
            .update({ is_active: false } as any)
            .eq("client_id", editClient!.id);
        }
      } else {
        // Insert client
        const { data: newClient, error: insertErr } = await supabase
          .from("clients")
          .insert(payload as any)
          .select("id")
          .single();
        if (insertErr) throw insertErr;

        // Create client user via edge function
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;

        const res = await supabase.functions.invoke("create-client-user", {
          body: {
            email: form.email.trim(),
            name: form.contact_name.trim(),
            client_id: newClient.id,
          },
        });

        if (res.error) throw new Error(res.error.message || "Failed to create client user");

        setCreatedCreds({
          email: form.email.trim(),
          password: res.data.temporary_password,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-clients"] });
      queryClient.invalidateQueries({ queryKey: ["admin-client-detail"] });
      if (isEdit || !createdCreds) {
        toast({ title: "Client saved successfully" });
        if (isEdit) onOpenChange(false);
      }
    },
    onError: (e: Error) =>
      toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const handleNext = () => {
    if (validateStep1()) setStep(2);
  };
  const handleSave = () => {
    if (validateStep2()) saveMutation.mutate();
  };

  const isMonthlyPlan = form.billing_plan === "monthly_500" || form.billing_plan === "monthly_1000";

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!saveMutation.isPending) onOpenChange(o); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Client" : "Add New Client"}</DialogTitle>
          <DialogDescription>
            {createdCreds
              ? "Client created! Save the temporary credentials below."
              : `Step ${step} of 2 — ${step === 1 ? "Basic Information" : "Billing Information"}`}
          </DialogDescription>
        </DialogHeader>

        {/* Success credentials view */}
        {createdCreds && (
          <div className="space-y-4 py-4">
            <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-2">
              <p className="text-sm font-medium text-foreground">Client Login Credentials</p>
              <div className="grid gap-1 text-sm">
                <p className="text-muted-foreground">
                  Email: <span className="font-mono text-foreground">{createdCreds.email}</span>
                </p>
                <p className="text-muted-foreground">
                  Temporary Password:{" "}
                  <span className="font-mono text-foreground">{createdCreds.password}</span>
                </p>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Please share these credentials securely with the client.
              </p>
            </div>
            <DialogFooter>
              <Button onClick={() => onOpenChange(false)}>Done</Button>
            </DialogFooter>
          </div>
        )}

        {/* Step 1 */}
        {!createdCreds && step === 1 && (
          <>
            <div className="grid gap-4 py-2 max-h-[60vh] overflow-y-auto pr-1">
              <Field label="Company Name" error={errors.name}>
                <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
              </Field>
              <Field label="Contact Person Name" error={errors.contact_name}>
                <Input value={form.contact_name} onChange={(e) => set("contact_name", e.target.value)} />
              </Field>
              <Field label="Email Address" error={errors.email}>
                <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} disabled={isEdit} />
              </Field>
              <Field label="Phone Number" error={errors.phone}>
                <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
              </Field>
              <Field label="Business Type" error={errors.business_type}>
                <Select value={form.business_type} onValueChange={(v) => set("business_type", v)}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {BUSINESS_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Time Zone">
                <Select value={form.timezone} onValueChange={(v) => set("timezone", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map((tz) => (
                      <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
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
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={handleNext}>Next</Button>
            </DialogFooter>
          </>
        )}

        {/* Step 2 */}
        {!createdCreds && step === 2 && (
          <>
            <div className="grid gap-4 py-2 max-h-[60vh] overflow-y-auto pr-1">
              <Field label="Billing Plan">
                <RadioGroup value={form.billing_plan} onValueChange={(v) => set("billing_plan", v)} className="grid gap-2">
                  {[
                    { value: "payg", label: "Pay-as-you-go" },
                    { value: "monthly_500", label: "Monthly 500 minutes" },
                    { value: "monthly_1000", label: "Monthly 1000 minutes" },
                    { value: "enterprise", label: "Enterprise (custom)" },
                  ].map((p) => (
                    <div key={p.value} className="flex items-center gap-2">
                      <RadioGroupItem value={p.value} id={`plan-${p.value}`} />
                      <Label htmlFor={`plan-${p.value}`} className="font-normal cursor-pointer">
                        {p.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </Field>
              <Field label="Rate per Minute (₹)" error={errors.rate_per_minute}>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.rate_per_minute}
                  onChange={(e) => set("rate_per_minute", e.target.value)}
                />
              </Field>
              <Field label="Monthly Allowance (minutes)">
                <Input
                  type="number"
                  min="0"
                  value={form.monthly_allowance}
                  onChange={(e) => set("monthly_allowance", e.target.value)}
                  disabled={!isMonthlyPlan}
                />
              </Field>
              <Field label="Overage Rate (₹)" error={errors.overage_rate}>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.overage_rate}
                  onChange={(e) => set("overage_rate", e.target.value)}
                />
              </Field>
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
                  <Field label="Trial End Date" error={errors.trial_end_date}>
                    <Input
                      type="date"
                      value={form.trial_end_date}
                      onChange={(e) => set("trial_end_date", e.target.value)}
                    />
                  </Field>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button disabled={saveMutation.isPending} onClick={handleSave}>
                {saveMutation.isPending ? "Saving…" : isEdit ? "Save Changes" : "Create Client"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-sm">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
