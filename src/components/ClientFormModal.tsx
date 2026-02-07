import { useState, useEffect, useMemo } from "react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ClientFormData, ClientRecord, EMPTY_CLIENT_FORM } from "@/types/client";
import WizardStepper from "./wizard/WizardStepper";
import StepBasicInfo from "./wizard/StepBasicInfo";
import StepAgentFeatures from "./wizard/StepAgentFeatures";
import StepBilling from "./wizard/StepBilling";
import StepIntegrations from "./wizard/StepIntegrations";
import StepNotificationsSecurity from "./wizard/StepNotificationsSecurity";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editClient?: ClientRecord | null;
}

function generatePassword(length = 16): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*";
  return Array.from(crypto.getRandomValues(new Uint8Array(length)))
    .map((b) => chars[b % chars.length])
    .join("");
}

const TOTAL_STEPS = 5;

export default function ClientFormModal({ open, onOpenChange, editClient }: Props) {
  const isEdit = !!editClient;
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<ClientFormData>(EMPTY_CLIENT_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof ClientFormData, string>>>({});
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [createdCreds, setCreatedCreds] = useState<{ email: string; password: string } | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const generatedPassword = useMemo(() => generatePassword(), [open]);

  const isDirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(EMPTY_CLIENT_FORM), [form]);

  useEffect(() => {
    if (!open) {
      setStep(1);
      setErrors({});
      setCreatedCreds(null);
      setCompletedSteps([]);
      return;
    }
    if (editClient) {
      setForm({
        ...EMPTY_CLIENT_FORM,
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

  const set = (field: keyof ClientFormData, value: string | boolean | number) =>
    setForm((f) => ({ ...f, [field]: value }));

  // ---- Validation ----
  const validateStep = (s: number): boolean => {
    const e: Partial<Record<keyof ClientFormData, string>> = {};
    if (s === 1) {
      if (!form.name.trim()) e.name = "Company name is required";
      if (!form.contact_name.trim()) e.contact_name = "Contact name is required";
      if (!form.email.trim()) e.email = "Email is required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Invalid email";
      if (!form.phone.trim()) e.phone = "Phone is required";
      else if (!/^\+?[\d\s()-]{7,20}$/.test(form.phone)) e.phone = "Invalid phone number";
      if (!form.business_type) e.business_type = "Select a business type";
    }
    if (s === 3) {
      if (Number(form.rate_per_minute) < 0) e.rate_per_minute = "Must be ≥ 0";
      if (Number(form.overage_rate) < 0) e.overage_rate = "Must be ≥ 0";
      if (form.has_trial && !form.trial_end_date) e.trial_end_date = "Select trial end date";
    }
    if (s === 5) {
      if (form.password_mode === "manual") {
        if (!form.manual_password) e.manual_password = "Password is required";
        else if (form.manual_password.length < 8) e.manual_password = "Min 8 characters";
        if (form.manual_password !== form.manual_password_confirm)
          e.manual_password_confirm = "Passwords do not match";
      }
      if (form.notif_webhook && !form.notif_webhook_url.trim())
        e.notif_webhook_url = "Webhook URL is required";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setCompletedSteps((prev) => (prev.includes(step) ? prev : [...prev, step]));
      setStep((s) => Math.min(s + 1, TOTAL_STEPS));
    }
  };

  const handleBack = () => setStep((s) => Math.max(s - 1, 1));

  const handleCancel = () => {
    if (isDirty && !isEdit) {
      setShowCancelConfirm(true);
    } else {
      onOpenChange(false);
    }
  };

  // ---- Submit ----
  const saveMutation = useMutation({
    mutationFn: async () => {
      const clientPayload: Record<string, unknown> = {
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
        const { error } = await supabase
          .from("clients")
          .update(clientPayload as any)
          .eq("id", editClient!.id);
        if (error) throw error;

        if (form.status === "inactive" && editClient!.status !== "inactive") {
          await supabase.from("users").update({ is_active: false } as any).eq("client_id", editClient!.id);
        }
        return;
      }

      // 1. Insert client
      const { data: newClient, error: insertErr } = await supabase
        .from("clients")
        .insert(clientPayload as any)
        .select("id")
        .single();
      if (insertErr) throw insertErr;
      const clientId = newClient.id;

      // 2. Update client_features (auto-created by trigger)
      const { error: featErr } = await supabase
        .from("client_features")
        .update({
          call_recordings_access: form.feature_call_recordings,
          call_transcripts: form.feature_call_transcripts,
          realtime_monitoring: form.feature_realtime_monitoring,
          analytics_dashboard: form.feature_analytics_dashboard,
          data_export: form.feature_data_export,
          api_access: form.feature_api_access,
          calendar_integration: form.feature_calendar_integration,
          custom_branding: form.feature_custom_branding,
          max_concurrent_calls: form.max_concurrent_calls,
        } as any)
        .eq("client_id", clientId);
      if (featErr) throw featErr;

      // 3. Insert integrations
      const integrations: { integration_type: string; config: Record<string, string> }[] = [];
      if (form.integration_google_sheets && form.google_sheets_url)
        integrations.push({ integration_type: "google_sheets", config: { sheet_url: form.google_sheets_url } });
      if (form.integration_google_calendar && form.google_calendar_id)
        integrations.push({ integration_type: "google_calendar", config: { calendar_id: form.google_calendar_id } });
      if (form.integration_cal_com && form.cal_com_api_key)
        integrations.push({ integration_type: "cal_com", config: { api_key: form.cal_com_api_key } });
      if (form.integration_webhook && form.webhook_url)
        integrations.push({ integration_type: "custom_webhook", config: { webhook_url: form.webhook_url } });

      if (integrations.length > 0) {
        const { error: intErr } = await supabase
          .from("client_integrations")
          .insert(integrations.map((i) => ({ client_id: clientId, ...i, status: "configured" })) as any);
        if (intErr) throw intErr;
      }

      // 4. Update client_notifications (auto-created by trigger)
      const { error: notifErr } = await supabase
        .from("client_notifications")
        .update({
          email_daily_summary: form.notif_daily_summary,
          email_weekly_report: form.notif_weekly_report,
          email_low_balance: form.notif_low_balance,
          email_call_failure: form.notif_call_failure,
          sms_notifications: form.notif_sms,
          webhook_notifications: form.notif_webhook,
          webhook_url: form.notif_webhook ? form.notif_webhook_url : null,
        } as any)
        .eq("client_id", clientId);
      if (notifErr) throw notifErr;

      // 5. Assign agent
      if (form.agent_id) {
        const { error: agentErr } = await supabase
          .from("client_agent_assignments")
          .insert({
            client_id: clientId,
            agent_id: form.agent_id,
            phone_number: form.agent_phone || null,
            status: "active",
          } as any);
        if (agentErr) throw agentErr;
      }

      // 6. Create client user
      const res = await supabase.functions.invoke("create-client-user", {
        body: {
          email: form.email.trim(),
          name: form.contact_name.trim(),
          client_id: clientId,
          ...(form.password_mode === "manual" ? { password: form.manual_password } : {}),
        },
      });
      if (res.error) throw new Error(res.error.message || "Failed to create client user");

      setCreatedCreds({
        email: form.email.trim(),
        password: form.password_mode === "manual" ? form.manual_password : (res.data?.temporary_password ?? generatedPassword),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-clients"] });
      queryClient.invalidateQueries({ queryKey: ["admin-client-detail"] });
      if (isEdit) {
        toast({ title: "Client saved successfully" });
        onOpenChange(false);
      }
    },
    onError: (e: Error) =>
      toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const handleSubmit = () => {
    if (validateStep(5)) {
      setCompletedSteps((prev) => (prev.includes(5) ? prev : [...prev, 5]));
      saveMutation.mutate();
    }
  };

  const stepTitle = ["Basic Information", "Agent & Features", "Billing", "Integrations", "Notifications & Security"];

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => { if (!saveMutation.isPending) { if (!o) handleCancel(); else onOpenChange(o); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit Client" : "Add New Client"}</DialogTitle>
            <DialogDescription>
              {createdCreds
                ? "Client created! Save the temporary credentials below."
                : `Step ${step} of ${TOTAL_STEPS} — ${stepTitle[step - 1]}`}
            </DialogDescription>
          </DialogHeader>

          {!createdCreds && !isEdit && (
            <div className="py-2">
              <WizardStepper currentStep={step} completedSteps={completedSteps} />
            </div>
          )}

          {/* Success View */}
          {createdCreds && (
            <div className="space-y-4 py-4">
              <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-2">
                <p className="text-sm font-medium text-foreground">Client Login Credentials</p>
                <div className="grid gap-1 text-sm">
                  <p className="text-muted-foreground">
                    Email: <span className="font-mono text-foreground">{createdCreds.email}</span>
                  </p>
                  <p className="text-muted-foreground">
                    Password: <span className="font-mono text-foreground">{createdCreds.password}</span>
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

          {/* Wizard Steps */}
          {!createdCreds && (
            <>
              <div className="flex-1 overflow-y-auto pr-1 py-2 min-h-0">
                {step === 1 && <StepBasicInfo form={form} set={set} errors={errors} isEdit={isEdit} />}
                {step === 2 && <StepAgentFeatures form={form} set={set} errors={errors} />}
                {step === 3 && <StepBilling form={form} set={set} errors={errors} />}
                {step === 4 && <StepIntegrations form={form} set={set} />}
                {step === 5 && <StepNotificationsSecurity form={form} set={set} errors={errors} generatedPassword={generatedPassword} />}
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={handleCancel}>Cancel</Button>
                <div className="flex gap-2">
                  {step > 1 && (
                    <Button variant="outline" onClick={handleBack}>Back</Button>
                  )}
                  {step < TOTAL_STEPS && (
                    <Button onClick={handleNext}>Next</Button>
                  )}
                  {step === TOTAL_STEPS && (
                    <Button disabled={saveMutation.isPending} onClick={isEdit ? () => { saveMutation.mutate(); } : handleSubmit}>
                      {saveMutation.isPending ? "Saving…" : isEdit ? "Save Changes" : "Create Client"}
                    </Button>
                  )}
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to discard them?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Editing</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setShowCancelConfirm(false); onOpenChange(false); }}>
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
